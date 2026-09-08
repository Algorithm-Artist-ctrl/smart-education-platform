// types/database.types.ts
export type UserRole = 'student' | 'teacher' | 'parent' | 'admin' | 'super_admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  phone?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  institution_id?: string | null;
  class_id?: string | null;
  section_id?: string | null;
  roll_number?: string | null;
  parent_id?: string | null;
  learning_goals: string[];
  current_streak: number;
  total_points: number;
  level: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  class?: AcademicClass;
  section?: Section;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  created_at: string;
}

export interface AcademicClass {
  id: string;
  institution_id: string;
  name: string;
  grade_level: number;
  created_at: string;
}

export interface Section {
  id: string;
  class_id: string;
  name: string;
}

export interface Subject {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  description?: string | null;
  difficulty_level: number; // 1, 2, 3
  order_index: number;
  created_at: string;
  subject?: Subject;
}

export interface LearningContent {
  id: string;
  topic_id: string;
  title: string;
  content_type: 'note' | 'video' | 'document' | 'lesson' | 'external';
  content_url?: string | null;
  body_markdown?: string | null;
  file_path?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string | null;
  subject_id: string;
  topic_id?: string | null;
  assessment_type: 'initial_assessment' | 'quiz' | 'exam' | 'practice';
  total_marks: number;
  duration_minutes: number;
  created_by?: string | null;
  is_published: boolean;
  created_at: string;
  subject?: Subject;
  topic?: Topic;
}

export interface Question {
  id: string;
  assessment_id: string;
  topic_id?: string | null;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation?: string | null;
  difficulty: number;
  marks: number;
}

export interface QuizAttempt {
  id: string;
  assessment_id: string;
  student_id: string;
  start_time: string;
  end_time?: string | null;
  total_score: number;
  max_score: number;
  percentage: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  assessment?: Assessment;
}

export interface QuizAttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_index?: number | null;
  is_correct: boolean;
  time_spent_seconds: number;
}

export interface WeakTopic {
  id: string;
  student_id: string;
  topic_id: string;
  accuracy_rate: number;
  total_attempts: number;
  incorrect_count: number;
  status: 'active' | 'improving' | 'resolved';
  last_evaluated_at: string;
  topic?: Topic;
}

export interface StudyPlan {
  id: string;
  student_id: string;
  plan_date: string;
  title: string;
  description?: string | null;
  subject_id?: string | null;
  topic_id?: string | null;
  duration_minutes: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'rescheduled';
  completed_at?: string | null;
  created_at: string;
  subject?: Subject;
  topic?: Topic;
}

export interface RevisionTask {
  id: string;
  student_id: string;
  topic_id: string;
  reason?: string | null;
  recommended_content_id?: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  topic?: Topic;
  recommended_content?: LearningContent;
}

export interface LearningPath {
  id: string;
  student_id: string;
  subject_id: string;
  current_topic_id?: string | null;
  recommended_next_topic_id?: string | null;
  status: string;
  updated_at: string;
  subject?: Subject;
  current_topic?: Topic;
  recommended_next_topic?: Topic;
}

export interface Assignment {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string | null;
  title: string;
  description: string;
  due_date: string;
  attachment_url?: string | null;
  max_points: number;
  created_at: string;
  subject?: Subject;
  teacher?: Profile;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text?: string | null;
  file_url?: string | null;
  submitted_at: string;
  grade?: number | null;
  feedback?: string | null;
  status: 'submitted' | 'graded' | 'late' | 'returned';
  assignment?: Assignment;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  marked_by?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'assignment' | 'quiz' | 'grade' | 'revision' | 'achievement' | 'announcement';
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  criteria_type: string;
  criteria_value: number;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
}

export interface CareerProfile {
  id: string;
  student_id: string;
  interests: string[];
  skills: string[];
  target_careers: string[];
  resume_data: Record<string, any>;
  recommendations: Record<string, any>;
  updated_at: string;
}
