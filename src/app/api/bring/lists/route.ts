import Bring from 'bring-shopping';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const bring = new Bring({
      mail: email,
      password: password,
    });

    await bring.login();
    const listsData = await bring.loadLists();
    
    return Response.json({ lists: listsData.lists });
  } catch (error: unknown) {
    console.error('Error fetching Bring! lists:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json({ error: errorMessage || 'Authentication failed' }, { status: 500 });
  }
}
