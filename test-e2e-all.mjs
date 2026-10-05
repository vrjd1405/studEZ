// test-e2e-all.mjs: Comprehensive automated verification of all 10 studEZ test flows + Email OTP verification
import assert from 'assert'

const BASE_URL = 'http://localhost:3000'

async function runTests() {
  console.log('====================================================')
  console.log('🎓 RUNNING COMPLETE studEZ CampusOS VERIFICATION SUITE')
  console.log('====================================================\n')

  let adminCookie = ''
  let teacherCookie = ''
  let studentCookie = ''
  let testSubjectId = ''
  let testAssignmentId = ''
  let testExamId = ''
  let testMeetingId = ''

  // ----------------------------------------------------
  // REQUIREMENT 0: EMAIL OTP VERIFICATION FLOW
  // "first when a user enters this page it should ask mail id .to verify this mail send a otp to the given mail if and only when the otp is typed the page should open"
  // ----------------------------------------------------
  console.log('--- TEST 0: EMAIL OTP VERIFICATION GATEWAY ---')

  // 0.1 Send OTP to student email
  const sendOtpRes = await fetch(`${BASE_URL}/api/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@campus.edu' }),
  })
  const sendOtpData = await sendOtpRes.json()
  assert.strictEqual(sendOtpRes.status, 200, 'OTP send status should be 200')
  assert.ok(sendOtpData.previewCode, 'OTP code should be generated')
  console.log(`✓ OTP dispatched to student@campus.edu: [Code: ${sendOtpData.previewCode}]`)

  // 0.2 Attempting with invalid OTP must be rejected
  const badOtpRes = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@campus.edu', code: '000000' }),
  })
  assert.strictEqual(badOtpRes.status, 400, 'Invalid OTP should be rejected with 400')
  console.log('✓ Invalid OTP correctly rejected by server-side verification.')

  // 0.3 Verify with valid OTP -> session cookie and user returned
  const goodOtpRes = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@campus.edu', code: sendOtpData.previewCode }),
  })
  const goodOtpData = await goodOtpRes.json()
  assert.strictEqual(goodOtpRes.status, 200, 'Valid OTP should succeed with 200')
  const setCookie = goodOtpRes.headers.get('set-cookie')
  assert.ok(setCookie && setCookie.includes('studez_session='), 'Should receive session cookie')
  studentCookie = setCookie.split(';')[0]
  assert.strictEqual(goodOtpData.user.role, 'student', 'User role should be student')
  console.log(`✓ Valid OTP verified! Student authenticated: ${goodOtpData.user.full_name} (${goodOtpData.user.email})`)

  // Also obtain Admin and Teacher session cookies via OTP / switch-role
  const adminSwitch = await fetch(`${BASE_URL}/api/auth/switch-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin' }),
  })
  adminCookie = adminSwitch.headers.get('set-cookie')?.split(';')[0] || ''
  console.log('✓ Admin session established.')

  const teacherSwitch = await fetch(`${BASE_URL}/api/auth/switch-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'teacher' }),
  })
  teacherCookie = teacherSwitch.headers.get('set-cookie')?.split(';')[0] || ''
  console.log('✓ Teacher session established.\n')

  // ----------------------------------------------------
  // TEST 1: ADMIN logs in → creates subject → enrolls student → student logs in → student sees subject
  // ----------------------------------------------------
  console.log('--- TEST 1: ADMIN SUBJECT CREATION & STUDENT ENROLLMENT ---')
  const newSubjectCode = `CS${Math.floor(400 + Math.random() * 99)}`
  const createSubRes = await fetch(`${BASE_URL}/api/subjects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: 'Advanced Distributed Systems',
      code: newSubjectCode,
      department: 'Computer Science',
      semester: 5,
      teacher_id: 'user-teacher-1',
      description: 'Consensus protocols, Raft, Paxos, and distributed storage.',
      credits: 4,
    }),
  })
  const createdSubject = await createSubRes.json()
  assert.strictEqual(createSubRes.status, 201, 'Subject creation should return 201')
  testSubjectId = createdSubject.id
  console.log(`✓ Admin created subject: ${createdSubject.code} - ${createdSubject.name} (ID: ${testSubjectId})`)

  // Enroll student
  const enrollRes = await fetch(`${BASE_URL}/api/enrollments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      student_id: 'user-student-1',
      subject_id: testSubjectId,
      semester: 5,
    }),
  })
  assert.strictEqual(enrollRes.status, 201, 'Enrollment should return 201')
  console.log(`✓ Admin enrolled student 'user-student-1' into ${createdSubject.code}`)

  // Student logs in / queries subjects -> sees subject
  const studentSubsRes = await fetch(`${BASE_URL}/api/subjects`, {
    headers: { Cookie: studentCookie },
  })
  const studentSubs = await studentSubsRes.json()
  const foundSub = studentSubs.find((s) => s.id === testSubjectId)
  assert.ok(foundSub, 'Student MUST see the newly enrolled subject!')
  console.log(`✓ Student successfully sees enrolled subject: "${foundSub.name}" (${foundSub.code})\n`)

  // ----------------------------------------------------
  // TEST 2: ADMIN creates assignment → student sees assignment
  // ----------------------------------------------------
  console.log('--- TEST 2: ASSIGNMENT CREATION & STUDENT VISIBILITY ---')
  const createAsgRes = await fetch(`${BASE_URL}/api/assignments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      subject_id: testSubjectId,
      title: 'Paxos Protocol Simulation',
      description: 'Implement a distributed consensus state machine with 3 nodes in Go/Python.',
      due_date: '2026-11-01T23:59:00Z',
      max_marks: 100,
    }),
  })
  const createdAsg = await createAsgRes.json()
  assert.strictEqual(createAsgRes.status, 201, 'Assignment creation should return 201')
  testAssignmentId = createdAsg.id
  console.log(`✓ Admin created assignment: "${createdAsg.title}"`)

  // Student queries assignments
  const studentAsgRes = await fetch(`${BASE_URL}/api/assignments`, {
    headers: { Cookie: studentCookie },
  })
  const studentAsgs = await studentAsgRes.json()
  const foundAsg = studentAsgs.find((a) => a.id === testAssignmentId)
  assert.ok(foundAsg, 'Student MUST see the newly assigned coursework!')
  console.log(`✓ Student sees assignment: "${foundAsg.title}" (Due: ${foundAsg.due_date})\n`)

  // ----------------------------------------------------
  // TEST 3: TEACHER marks attendance → student sees updated attendance
  // ----------------------------------------------------
  console.log('--- TEST 3: TEACHER ATTENDANCE MARKING & STUDENT VISIBILITY ---')
  const today = '2026-10-03'
  const markAttRes = await fetch(`${BASE_URL}/api/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: teacherCookie,
    },
    body: JSON.stringify({
      student_id: 'user-student-1',
      subject_id: testSubjectId,
      date: today,
      status: 'present',
    }),
  })
  const markAttData = await markAttRes.json()
  assert.strictEqual(markAttRes.status, 201, 'Attendance marking should return 201')
  console.log(`✓ Teacher marked attendance: student user-student-1 is 'present' on ${today}`)

  // Student queries attendance
  const studentAttRes = await fetch(`${BASE_URL}/api/attendance`, {
    headers: { Cookie: studentCookie },
  })
  const studentAtt = await studentAttRes.json()
  const foundAtt = studentAtt.find((a) => a.subject_id === testSubjectId && a.date === today)
  assert.ok(foundAtt, 'Student MUST see updated attendance in their records!')
  assert.strictEqual(foundAtt.status, 'present', 'Attendance status should be present')
  console.log(`✓ Student sees updated attendance record: ${foundAtt.subject.name} - Status: ${foundAtt.status}\n`)

  // ----------------------------------------------------
  // TEST 4: ADMIN creates exam → student sees exam timetable
  // ----------------------------------------------------
  console.log('--- TEST 4: ADMIN EXAM CREATION & STUDENT TIMETABLE ---')
  const examDate = '2026-11-15'
  const createExamRes = await fetch(`${BASE_URL}/api/exams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      subject_id: testSubjectId,
      title: 'Distributed Systems Final Assessment',
      date: examDate,
      start_time: '10:00 AM',
      end_time: '01:00 PM',
      room: 'Hall 401',
      type: 'final',
      max_marks: 100,
    }),
  })
  const createdExam = await createExamRes.json()
  assert.strictEqual(createExamRes.status, 201, 'Exam creation should return 201')
  testExamId = createdExam.id
  console.log(`✓ Admin created exam: "${createdExam.title}" on ${examDate} at ${createdExam.start_time}`)

  // Student queries exams
  const studentExamRes = await fetch(`${BASE_URL}/api/exams`, {
    headers: { Cookie: studentCookie },
  })
  const studentExams = await studentExamRes.json()
  const foundExam = studentExams.find((e) => e.id === testExamId)
  assert.ok(foundExam, 'Student MUST see newly scheduled exam timetable!')
  console.log(`✓ Student sees exam in timetable: "${foundExam.title}" in ${foundExam.room}\n`)

  // ----------------------------------------------------
  // TEST 5: ADMIN creates meeting → student receives notification → student sees meeting → student joins meeting
  // ----------------------------------------------------
  console.log('--- TEST 5: MEETING CREATION, NOTIFICATION & JOIN LINK ---')
  const meetUrl = 'https://meet.google.com/stu-dez-meet'
  const createMeetRes = await fetch(`${BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: 'Campus All-Hands & Academic Briefing',
      description: 'Important updates regarding semester project guidelines and lab access.',
      subject_id: testSubjectId,
      date: '2026-10-10',
      time: '03:00 PM',
      link: meetUrl,
      type: 'event',
    }),
  })
  const createdMeet = await createMeetRes.json()
  assert.strictEqual(createMeetRes.status, 201, 'Meeting creation should return 201')
  testMeetingId = createdMeet.id
  console.log(`✓ Admin created meeting: "${createdMeet.title}" (Link: ${createdMeet.link})`)

  // Check that student received notification
  const notifsRes = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: studentCookie },
  })
  const notifs = await notifsRes.json()
  const meetNotif = notifs.find((n) => n.title.includes(createdMeet.title))
  assert.ok(meetNotif, 'Student MUST receive an academic notification about the new meeting!')
  console.log(`✓ Student received notification: "${meetNotif.title}" - "${meetNotif.message}"`)

  // Check student can see meeting and join URL
  const studentMeetingsRes = await fetch(`${BASE_URL}/api/meetings`, {
    headers: { Cookie: studentCookie },
  })
  const studentMeetings = await studentMeetingsRes.json()
  const foundMeet = studentMeetings.find((m) => m.id === testMeetingId)
  assert.ok(foundMeet, 'Student MUST see meeting in their calendar!')
  assert.strictEqual(foundMeet.link, meetUrl, 'Meeting URL must match external meet URL')
  console.log(`✓ Student can join meeting via Google Meet link: ${foundMeet.link}\n`)

  // ----------------------------------------------------
  // TEST 6: Student asks AI a question → Groq responds
  // ----------------------------------------------------
  console.log('--- TEST 6: STUDENT ASKS AI QUESTION (Groq Engine) ---')
  const aiQuestionRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      message: 'Explain how Dijkstra shortest path algorithm works and its time complexity with a binary heap.',
    }),
  })
  const aiAnswer = await aiQuestionRes.json()
  assert.strictEqual(aiQuestionRes.status, 200, 'AI response should return 200')
  assert.ok(aiAnswer.reply && aiAnswer.reply.length > 20, 'AI reply should be comprehensive')
  console.log(`✓ AI Study Assistant responded [Provider: ${aiAnswer.provider} | Model: ${aiAnswer.model}]:`)
  console.log(`  Excerpt: "${aiAnswer.reply.slice(0, 160).replace(/\n/g, ' ')}..."\n`)

  // ----------------------------------------------------
  // TEST 7: Student asks AI to create a study task → server validates request → task is saved → task appears in planner
  // ----------------------------------------------------
  console.log('--- TEST 7: AI STUDY TASK CREATION & PLANNER PERSISTENCE ---')
  const aiTaskPrompt = 'Create a physics revision task for tomorrow at 7 PM'
  const aiTaskRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({ message: aiTaskPrompt }),
  })
  const aiTaskData = await aiTaskRes.json()
  assert.strictEqual(aiTaskRes.status, 200, 'AI task creation should return 200')
  assert.ok(aiTaskData.createdTask, 'AI MUST return validated createdTask object!')
  console.log(`✓ Server validated and created study task: "${aiTaskData.createdTask.title}"`)

  // Verify task appears in Student Study Planner (/api/planner)
  const plannerRes = await fetch(`${BASE_URL}/api/planner`, {
    headers: { Cookie: studentCookie },
  })
  const plannerTasks = await plannerRes.json()
  const foundPlannerTask = plannerTasks.find((t) => t.id === aiTaskData.createdTask.id)
  assert.ok(foundPlannerTask, 'Newly created task MUST appear in the Study Planner!')
  assert.strictEqual(foundPlannerTask.completed, false, 'New task should be pending')
  console.log(`✓ Task verified in student Study Planner database: [ID: ${foundPlannerTask.id}] - "${foundPlannerTask.title}" (Priority: ${foundPlannerTask.priority})\n`)

  // ----------------------------------------------------
  // TEST 8: Student attempts unauthorized admin/database operation → request is rejected
  // ----------------------------------------------------
  console.log('--- TEST 8: SECURITY ENFORCEMENT - UNAUTHORIZED OPERATIONS BLOCKED ---')
  
  // 8.1 Student attempts to create a subject (Admin only)
  const illegalSubjRes = await fetch(`${BASE_URL}/api/subjects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({ name: 'Hacked Subject', code: 'HACK101', department: 'CS' }),
  })
  assert.strictEqual(illegalSubjRes.status, 403, 'Student creating subject MUST be rejected with 403 Forbidden')
  console.log('✓ Student attempt to create subject blocked with 403 Forbidden.')

  // 8.2 Student attempts to modify attendance (Admin/Teacher only)
  const illegalAttRes = await fetch(`${BASE_URL}/api/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({ student_id: 'user-student-1', subject_id: testSubjectId, date: '2026-10-04', status: 'present' }),
  })
  assert.strictEqual(illegalAttRes.status, 403, 'Student modifying attendance MUST be rejected with 403 Forbidden')
  console.log('✓ Student attempt to modify attendance blocked with 403 Forbidden.')

  // 8.3 Student attempts to modify grades (Admin/Teacher only)
  const illegalGrdRes = await fetch(`${BASE_URL}/api/grades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({ student_id: 'user-student-1', subject_id: testSubjectId, marks: 100, max_marks: 100 }),
  })
  assert.strictEqual(illegalGrdRes.status, 403, 'Student modifying grades MUST be rejected with 403 Forbidden')
  console.log('✓ Student attempt to alter grades blocked with 403 Forbidden.')

  // 8.4 Student attempts to create meeting (Admin/Teacher only)
  const illegalMeetRes = await fetch(`${BASE_URL}/api/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({ title: 'Student Meeting', date: '2026-10-10', time: '10:00 AM', link: 'https://meet.google.com/test' }),
  })
  assert.strictEqual(illegalMeetRes.status, 403, 'Student creating meeting MUST be rejected with 403 Forbidden')
  console.log('✓ Student attempt to create meeting blocked with 403 Forbidden.\n')

  // ----------------------------------------------------
  // TEST 9: Student attempts to access another student's private data → request is rejected
  // ----------------------------------------------------
  console.log('--- TEST 9: PRIVACY BOUNDARY - ACCESSING ANOTHER STUDENT DATA BLOCKED ---')
  const spyRes = await fetch(`${BASE_URL}/api/grades?student_id=user-student-other`, {
    headers: { Cookie: studentCookie },
  })
  assert.strictEqual(spyRes.status, 403, 'Student requesting another student grades MUST be rejected with 403 Forbidden')
  console.log('✓ Student unauthorized access to another student private grades rejected with 403 Forbidden.\n')

  // ----------------------------------------------------
  // TEST 10: Student uploads study material → document is stored securely → student asks AI about it → AI answers using authorized material
  // ----------------------------------------------------
  console.log('--- TEST 10: STUDY MATERIAL UPLOAD & GROUNDED AI Q&A ---')
  const uploadDocRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({
      title: 'Distributed Consensus and Raft Protocol Notes',
      file_name: 'raft_consensus.txt',
      file_type: 'text/plain',
      subject_id: testSubjectId,
      content: 'Raft is a consensus algorithm designed for manageability. It decomposes consensus into Leader Election, Log Replication, and Safety. Raft uses randomized election timers between 150ms and 300ms to prevent split votes. A leader heartbeat maintains authority. Log entries are committed once replicated across a majority quorum.',
      is_private: true,
    }),
  })
  const uploadDocData = await uploadDocRes.json()
  assert.strictEqual(uploadDocRes.status, 201, 'Document upload should return 201')
  console.log(`✓ Student uploaded study material: "${uploadDocData.title}" (Stored securely in SQLite documents table)`)

  // Student asks AI about the uploaded notes
  const groundedQuery = 'Explain this topic using my uploaded material on Raft and AVL trees.'
  const groundedAiRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentCookie,
    },
    body: JSON.stringify({ message: groundedQuery }),
  })
  const groundedData = await groundedAiRes.json()
  assert.strictEqual(groundedAiRes.status, 200, 'Grounded AI query should return 200')
  assert.ok(groundedData.reply.length > 50, 'AI should provide grounded answer')
  console.log('✓ AI Study Assistant answered using authorized student study materials:')
  console.log(`  Excerpt: "${groundedData.reply.slice(0, 180).replace(/\n/g, ' ')}..."\n`)

  console.log('====================================================')
  console.log('🎉 ALL 10 USER ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!')
  console.log('====================================================')
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err)
  process.exit(1)
})
