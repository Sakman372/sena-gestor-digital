import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorización requerido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const certificateId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null

    // GET /certificates/types - Get all certificate types
    if (req.method === 'GET' && url.pathname.includes('/types')) {
      const { data, error } = await supabaseAdmin
        .from('certificate_types')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (error) {
        console.error('Error fetching certificate types:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /certificates/:id - Get specific certificate
    if (req.method === 'GET' && certificateId && certificateId !== 'types') {
      const { data, error } = await supabaseAdmin
        .from('certificates')
        .select(`
          *,
          certificate_types (nombre, descripcion),
          profiles!certificates_user_id_fkey (nombres, apellidos, email)
        `)
        .eq('id', certificateId)
        .single()

      if (error) {
        console.error('Error fetching certificate:', error)
        return new Response(
          JSON.stringify({ error: 'Certificado no encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check access
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const isStaff = roleData?.role === 'admin' || roleData?.role === 'funcionario'
      if (data.user_id !== user.id && !isStaff) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /certificates - Get all certificates (filtered by role)
    if (req.method === 'GET') {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const isStaff = roleData?.role === 'admin' || roleData?.role === 'funcionario'

      let query = supabaseAdmin
        .from('certificates')
        .select(`
          *,
          certificate_types (nombre, descripcion),
          profiles!certificates_user_id_fkey (nombres, apellidos, email)
        `)
        .order('fecha_solicitud', { ascending: false })

      // Filter by user if not staff
      if (!isStaff) {
        query = query.eq('user_id', user.id)
      }

      // Apply filters from query params
      const estado = url.searchParams.get('estado')
      if (estado) {
        query = query.eq('estado', estado)
      }

      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching certificates:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data, count }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /certificates - Create new certificate request
    if (req.method === 'POST') {
      const { certificate_type_id, observaciones } = await req.json()

      if (!certificate_type_id) {
        return new Response(
          JSON.stringify({ error: 'certificate_type_id es requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('certificates')
        .insert({
          user_id: user.id,
          certificate_type_id,
          observaciones: observaciones || null
        })
        .select(`
          *,
          certificate_types (nombre, descripcion)
        `)
        .single()

      if (error) {
        console.error('Error creating certificate:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create notification
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: user.id,
          tipo: 'info',
          titulo: 'Solicitud Creada',
          mensaje: `Tu solicitud de ${data.certificate_types?.nombre} ha sido registrada.`
        })

      console.log('Certificate created:', data.id)
      return new Response(
        JSON.stringify({ message: 'Solicitud creada exitosamente', data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /certificates/:id - Update certificate (staff only)
    if (req.method === 'PUT' && certificateId) {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const isStaff = roleData?.role === 'admin' || roleData?.role === 'funcionario'
      if (!isStaff) {
        return new Response(
          JSON.stringify({ error: 'No autorizado para actualizar certificados' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updates = await req.json()
      const allowedFields = ['estado', 'observaciones', 'archivo_url', 'fecha_procesamiento', 'fecha_entrega']
      const filteredUpdates: Record<string, unknown> = {}
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field]
        }
      }

      // Auto-set dates based on estado
      if (updates.estado === 'en_proceso' && !filteredUpdates.fecha_procesamiento) {
        filteredUpdates.fecha_procesamiento = new Date().toISOString()
      }
      if (updates.estado === 'completado' && !filteredUpdates.fecha_entrega) {
        filteredUpdates.fecha_entrega = new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('certificates')
        .update(filteredUpdates)
        .eq('id', certificateId)
        .select(`
          *,
          certificate_types (nombre, descripcion)
        `)
        .single()

      if (error) {
        console.error('Error updating certificate:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Notify user of status change
      if (updates.estado) {
        const estadoMessages: Record<string, string> = {
          en_proceso: 'está siendo procesada',
          completado: 'ha sido completada',
          rechazado: 'ha sido rechazada'
        }
        
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: data.user_id,
            tipo: updates.estado === 'rechazado' ? 'error' : 'success',
            titulo: 'Actualización de Solicitud',
            mensaje: `Tu solicitud de ${data.certificate_types?.nombre} ${estadoMessages[updates.estado] || 'ha sido actualizada'}.`
          })
      }

      console.log('Certificate updated:', data.id)
      return new Response(
        JSON.stringify({ message: 'Certificado actualizado', data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /certificates/:id - Delete certificate (own or admin)
    if (req.method === 'DELETE' && certificateId) {
      // Check ownership or admin role
      const { data: certificate } = await supabaseAdmin
        .from('certificates')
        .select('user_id, estado')
        .eq('id', certificateId)
        .single()

      if (!certificate) {
        return new Response(
          JSON.stringify({ error: 'Certificado no encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const isAdmin = roleData?.role === 'admin'
      const isOwner = certificate.user_id === user.id

      if (!isAdmin && !isOwner) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Only allow deletion of pending certificates (unless admin)
      if (!isAdmin && certificate.estado !== 'pendiente') {
        return new Response(
          JSON.stringify({ error: 'Solo se pueden eliminar solicitudes pendientes' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseAdmin
        .from('certificates')
        .delete()
        .eq('id', certificateId)

      if (error) {
        console.error('Error deleting certificate:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Certificate deleted:', certificateId)
      return new Response(
        JSON.stringify({ message: 'Certificado eliminado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Certificates function error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
