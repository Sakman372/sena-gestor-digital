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
    const documentId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null

    // GET /documents/categories - Get all document categories
    if (req.method === 'GET' && url.pathname.includes('/categories')) {
      const { data, error } = await supabaseAdmin
        .from('document_categories')
        .select('*')
        .order('nombre')

      if (error) {
        console.error('Error fetching categories:', error)
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

    // GET /documents/:id - Get specific document
    if (req.method === 'GET' && documentId && documentId !== 'categories') {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select(`
          *,
          document_categories (nombre, descripcion)
        `)
        .eq('id', documentId)
        .single()

      if (error) {
        console.error('Error fetching document:', error)
        return new Response(
          JSON.stringify({ error: 'Documento no encontrado' }),
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

    // GET /documents - Get all documents (filtered by role)
    if (req.method === 'GET') {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const isStaff = roleData?.role === 'admin' || roleData?.role === 'funcionario'

      let query = supabaseAdmin
        .from('documents')
        .select(`
          *,
          document_categories (nombre, descripcion)
        `)
        .order('created_at', { ascending: false })

      if (!isStaff) {
        query = query.eq('user_id', user.id)
      }

      // Apply filters
      const category_id = url.searchParams.get('category_id')
      if (category_id) {
        query = query.eq('category_id', category_id)
      }

      const search = url.searchParams.get('search')
      if (search) {
        query = query.ilike('nombre', `%${search}%`)
      }

      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching documents:', error)
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

    // POST /documents - Create new document
    if (req.method === 'POST') {
      const { nombre, descripcion, archivo_url, category_id, tamano_bytes, tipo_mime, etiquetas } = await req.json()

      if (!nombre || !archivo_url) {
        return new Response(
          JSON.stringify({ error: 'nombre y archivo_url son requeridos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert({
          user_id: user.id,
          nombre,
          descripcion: descripcion || null,
          archivo_url,
          category_id: category_id || null,
          tamano_bytes: tamano_bytes || null,
          tipo_mime: tipo_mime || null,
          etiquetas: etiquetas || []
        })
        .select(`
          *,
          document_categories (nombre, descripcion)
        `)
        .single()

      if (error) {
        console.error('Error creating document:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Document created:', data.id)
      return new Response(
        JSON.stringify({ message: 'Documento creado exitosamente', data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /documents/:id - Update document
    if (req.method === 'PUT' && documentId) {
      // Check ownership
      const { data: document } = await supabaseAdmin
        .from('documents')
        .select('user_id')
        .eq('id', documentId)
        .single()

      if (!document) {
        return new Response(
          JSON.stringify({ error: 'Documento no encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (document.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const updates = await req.json()
      const allowedFields = ['nombre', 'descripcion', 'category_id', 'etiquetas']
      const filteredUpdates: Record<string, unknown> = {}
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field]
        }
      }

      const { data, error } = await supabaseAdmin
        .from('documents')
        .update(filteredUpdates)
        .eq('id', documentId)
        .select(`
          *,
          document_categories (nombre, descripcion)
        `)
        .single()

      if (error) {
        console.error('Error updating document:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Document updated:', data.id)
      return new Response(
        JSON.stringify({ message: 'Documento actualizado', data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /documents/:id - Delete document
    if (req.method === 'DELETE' && documentId) {
      const { data: document } = await supabaseAdmin
        .from('documents')
        .select('user_id')
        .eq('id', documentId)
        .single()

      if (!document) {
        return new Response(
          JSON.stringify({ error: 'Documento no encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const isAdmin = roleData?.role === 'admin'
      if (document.user_id !== user.id && !isAdmin) {
        return new Response(
          JSON.stringify({ error: 'No autorizado' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabaseAdmin
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        console.error('Error deleting document:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Document deleted:', documentId)
      return new Response(
        JSON.stringify({ message: 'Documento eliminado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Documents function error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
