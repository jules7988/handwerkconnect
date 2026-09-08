import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const jsonResponse = (
  status: number,
  body: Record<string, unknown>
): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, {
      error: 'METHOD_NOT_ALLOWED',
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(500, {
      error: 'DELETE_FAILED',
    });
  }

  const authorization = req.headers.get('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return jsonResponse(401, {
      error: 'UNAUTHORIZED',
    });
  }

  const accessToken = authorization.slice('Bearer '.length).trim();

  if (!accessToken) {
    return jsonResponse(401, {
      error: 'UNAUTHORIZED',
    });
  }

  const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Validate the supplied access token on the server.
    // The user ID is derived only from the validated token.
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return jsonResponse(401, {
        error: 'UNAUTHORIZED',
      });
    }

    // Hard-delete the authenticated Auth user.
    // Dependent public records are removed by verified ON DELETE CASCADE FKs.
    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id, false);

    if (deleteError) {
      return jsonResponse(500, {
        error: 'DELETE_FAILED',
      });
    }

    return jsonResponse(200, {
      success: true,
    });
  } catch {
    return jsonResponse(500, {
      error: 'DELETE_FAILED',
    });
  }
});