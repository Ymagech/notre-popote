import Bring from 'bring-shopping';

export async function POST(request: Request) {
  try {
    const { email, password, listUuid, items } = await request.json();
    if (!email || !password || !listUuid || !items || !Array.isArray(items)) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const bring = new Bring({
      mail: email,
      password: password,
    });

    await bring.login();

    // Export items sequentially to avoid rate-limiting or concurrency issues
    for (const item of items) {
      if (item.name) {
        await bring.saveItem(listUuid, item.name.trim(), item.specification || '');
      }
    }

    return Response.json({ success: true, count: items.length });
  } catch (error: unknown) {
    console.error('Error exporting to Bring!:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json({ error: errorMessage || 'Export failed' }, { status: 500 });
  }
}
