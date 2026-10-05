async function run() {
  // 1. Login or switch role to student
  const switchRes = await fetch('http://localhost:3000/api/auth/switch-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student' }),
  })
  const switchData = await switchRes.json()
  const cookie = switchRes.headers.get('set-cookie')?.split(';')[0]
  console.log('Student cookie:', cookie)

  // 2. Post chat message to /api/ai/chat
  const chatRes = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({
      message: 'Explain AVL tree balance factors and rotations using my uploaded study notes.',
      model: 'gemma-2-9b',
    }),
  })

  console.log('Status:', chatRes.status)
  const chatData = await chatRes.json()
  console.log('Chat response:', chatData)
}

run().catch(console.error)
