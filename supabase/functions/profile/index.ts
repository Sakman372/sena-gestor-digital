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

    // GET /profile - Get current user profile
    if (req.method === 'GET') {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return new Response(
          JSON.stringify({ error: 'Perfil no encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      return new Response(
        JSON.stringify({ 
          data: {
            ...profile,
            role: roleData?.role || 'aprendiz',
            email: user.email
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /profile - Update current user profile
    if (req.method === 'PUT') {
      const updates = await req.json()
      const allowedFields = ['nombres', 'apellidos', 'telefono', 'avatar_url']
      const filteredUpdates: Record<string, unknown> = {}
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field]
        }
      }

      if (Object.keys(filteredUpdates).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No hay campos válidos para actualizar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(filteredUpdates)
        .eq('user_id', user.id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      console.log('Profile updated:', user.id)
      return new Response(
        JSON.stringify({ 
          message: 'Perfil actualizado',
          data: {
            ...data,
            role: roleData?.role || 'aprendiz'
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /profile/change-password - Change password
    if (req.method === 'POST') {
      const url = new URL(req.url)
      if (url.pathname.includes('/change-password')) {
        const { new_password } = await req.json()

        if (!new_password || new_password.length < 6) {
          return new Response(
            JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: new_password
        })

        if (error) {
          console.error('Error changing password:', error)
          return new Response(
            JSON.stringify({ error: 'Error al cambiar la contraseña' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Password changed for user:', user.id)
        return new Response(
          JSON.stringify({ message: 'Contraseña actualizada exitosamente' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Profile function error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
