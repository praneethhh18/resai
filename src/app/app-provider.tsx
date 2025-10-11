
'use client';

import { AuthProvider } from "@/components/app/auth-provider";
import { FirebaseProvider, firebaseApp, auth, firestore } from "@/firebase";
import React from "react";

interface AppProviderProps {
    children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    return (
        <FirebaseProvider
            firebaseApp={firebaseApp}
            auth={auth}
            firestore={firestore}
        >
            <AuthProvider>
                {children}
            </AuthProvider>
        </FirebaseProvider>
    )
}
