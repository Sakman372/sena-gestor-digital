import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    // POST /auth/register
    if (req.method === 'POST' && action === 'register') {
      const { email, password, numero_identificacion, nombres, apellidos, telefono, role } = await req.json()

      if (!email || !password || !numero_identificacion || !nombres || !apellidos) {
        return new Response(
          JSON.stringify({ error: 'Campos requeridos: email, password, numero_identificacion, nombres, apellidos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          numero_identificacion,
          nombres,
          apellidos,
          telefono: telefono || '',
          role: role || 'aprendiz'
        }
      })

      if (error) {
        console.error('Register error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('User registered:', data.user?.id)
      return new Response(
        JSON.stringify({ message: 'Usuario registrado exitosamente', user: data.user }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /auth/login
    if (req.method === 'POST' && action === 'login') {
      const { email, password } = await req.json()

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email y password son requeridos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        console.error('Login error:', error)
        return new Response(
          JSON.stringify({ error: 'Credenciales inválidas' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user profile and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single()

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      console.log('User logged in:', data.user.id)
      return new Response(
        JSON.stringify({
          message: 'Login exitoso',
          user: data.user,
          profile,
          role: roleData?.role || 'aprendiz',
          session: data.session
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /auth/logout
    if (req.method === 'POST' && action === 'logout') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Token de autorización requerido' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const { error } = await supabase.auth.admin.signOut(token)

      if (error) {
        console.error('Logout error:', error)
      }

      return new Response(
        JSON.stringify({ message: 'Sesión cerrada exitosamente' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /auth/me - Get current user info
    if (req.method === 'GET' && action === 'me') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Token de autorización requerido' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return new Response(
          JSON.stringify({ error: 'Token inválido' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      return new Response(
        JSON.stringify({ user, profile, role: roleData?.role || 'aprendiz' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint no encontrado' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Auth function error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
