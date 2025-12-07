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

    // GET /stats - Get dashboard statistics
    if (req.method === 'GET') {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      const isStaff = roleData?.role === 'admin' || roleData?.role === 'funcionario'

      // Base query filter
      const userFilter = isStaff ? {} : { user_id: user.id }

      // Get certificates stats
      const { count: totalCertificates } = await supabaseAdmin
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .match(userFilter)

      const { count: pendingCertificates } = await supabaseAdmin
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .match(userFilter)
        .eq('estado', 'pendiente')

      const { count: inProcessCertificates } = await supabaseAdmin
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .match(userFilter)
        .eq('estado', 'en_proceso')

      const { count: completedCertificates } = await supabaseAdmin
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .match(userFilter)
        .eq('estado', 'completado')

      // Get documents count
      const { count: totalDocuments } = await supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .match(userFilter)

      // Get unread notifications
      const { count: unreadNotifications } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('leida', false)

      // Get recent activity (last 5 certificates)
      let recentQuery = supabaseAdmin
        .from('certificates')
        .select(`
          id,
          estado,
          fecha_solicitud,
          certificate_types (nombre)
        `)
        .order('fecha_solicitud', { ascending: false })
        .limit(5)

      if (!isStaff) {
        recentQuery = recentQuery.eq('user_id', user.id)
      }

      const { data: recentActivity } = await recentQuery

      // Staff-only stats
      let staffStats = null
      if (isStaff) {
        const { count: totalUsers } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        staffStats = {
          total_users: totalUsers || 0
        }
      }

      return new Response(
        JSON.stringify({
          data: {
            certificates: {
              total: totalCertificates || 0,
              pending: pendingCertificates || 0,
              in_process: inProcessCertificates || 0,
              completed: completedCertificates || 0
            },
            documents: {
              total: totalDocuments || 0
            },
            notifications: {
              unread: unreadNotifications || 0
            },
            recent_activity: recentActivity || [],
            staff_stats: staffStats,
            user_role: roleData?.role || 'aprendiz'
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Stats function error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
