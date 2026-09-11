// app/(dashboard)/student/subjects/page.tsx
import { redirect } from 'next/navigation';

export default function SubjectsPage() {
  redirect('/student/learning');
}
