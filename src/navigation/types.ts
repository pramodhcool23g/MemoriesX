export type RootStackParamList = {
    Intro: undefined;
    Login: undefined;
    Main: undefined;
    ChatList: undefined;
    Chat: { threadId: string; title?: string; isNew: boolean };
    LibraryStack: undefined;
    ImageLibrary: undefined;
    PersonalInfo: { userData: any };
};

export type MainTabParamList = {
    Home: undefined;
    Learn: undefined;
    Assess: undefined;
    Profile: undefined;
};

export type LearnStackParamList = {
    Courses: undefined;
    CourseDetail: { courseId: string };
    CourseQuiz: { courseId: string };
    LessonScreen: { lessonIndex: number, allLessons: any[], courseId: string, initialCompleted: number[] };
};

export type LibraryStackParamList = {
    LibraryList: undefined;
    ModelView: { modelData: any };
    ImageLibrary: undefined;
    VoiceAgent: undefined;
    VoiceAgentOpenAI: undefined;
};
