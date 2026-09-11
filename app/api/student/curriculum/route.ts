// app/api/student/curriculum/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getCurriculumHierarchy, 
  getStudentLearningPosition, 
  getPersonalizedLearningPath,
  getStudentWeakAreasDetailed,
  getStudentStrengthsDetailed
} from '@/lib/learning-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const subjectId = searchParams.get('subjectId') || undefined;

    const [
      hierarchy,
      learningPosition,
      personalizedPath,
      weakAreas,
      strengths,
    ] = await Promise.all([
      getCurriculumHierarchy(supabase, user.id, subjectId),
      getStudentLearningPosition(supabase, user.id, subjectId),
      getPersonalizedLearningPath(supabase, user.id, subjectId),
      getStudentWeakAreasDetailed(supabase, user.id),
      getStudentStrengthsDetailed(supabase, user.id),
    ]);

    return NextResponse.json({
      success: true,
      hierarchy,
      learningPosition,
      personalizedPath,
      weakAreas,
      strengths,
    });
  } catch (error: any) {
    console.error('Curriculum fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch curriculum' }, { status: 500 });
  }
}
