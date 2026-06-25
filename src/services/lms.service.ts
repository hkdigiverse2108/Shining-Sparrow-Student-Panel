import client from '../api/client';

export interface SubmitAnswer {
  questionId: string;
  answer: string;
}

export interface SubmitExamPayload {
  examId: string;
  answers: SubmitAnswer[];
  timeTaken: number; // in seconds
}

const lmsService = {
  getCourseLessons: async (courseId: string, params?: { page?: number; limit?: number }) => {
    const response = await client.get('/course-lesson/all', {
      params: { courseId, ...params },
    });
    return response.data;
  },

  getLessonById: async (lessonId: string) => {
    const response = await client.get(`/course-lesson/${lessonId}`);
    return response.data;
  },


  getExamForLesson: async (courseId: string, courseLessonId: string) => {
    const response = await client.get('/exam/all', {
      params: { courseId, courseLessonId },
    });
    return response.data;
  },

  getExamById: async (examId: string) => {
    const response = await client.get(`/exam/${examId}`);
    return response.data;
  },

  submitExam: async (payload: SubmitExamPayload) => {
    const response = await client.post('/exam/submit', payload);
    return response.data;
  },

  getExamAttempts: async (courseId: string, examId: string) => {
    const response = await client.get('/exam/attempts', {
      params: { courseId, examId },
    });
    return response.data;
  },

  getWorkshopCurriculums: async (workshopId: string, params?: { page?: number; limit?: number }) => {
    const response = await client.get('/workshop-curriculum/all', {
      params: { workshopFilter: workshopId, ...params },
    });
    return response.data;
  },

  completeWorkshopCurriculum: async (payload: { workshopId: string; workshopCurriculumId: string }) => {
    const response = await client.post('/workshop-curriculum/complete', payload);
    return response.data;
  },

  getWorkshopProgress: async (workshopId: string) => {
    const response = await client.get(`/workshop-curriculum/progress/${workshopId}`);
    return response.data;
  },

  completeLesson: async (payload: { courseId: string; courseLessonId: string }) => {
    const response = await client.post('/course-lesson/complete', payload);
    return response.data;
  },
};

export default lmsService;
