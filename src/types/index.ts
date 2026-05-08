export interface User {
    name: string;
    email: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    progress: number;
    category: string;
}

export interface Quiz {
    id: string;
    title: string;
    totalQuestions: number;
}
