import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore,arrayUnion, doc, setDoc, getDoc, collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc, where, getDocs, orderBy } from 'firebase/firestore';
import {
    Menu,
    X,
    User,
    LogOut,
    Briefcase,
    Calendar,
    Search,
    MessageSquare,
    Send,
    Loader2,
    Users,
    Info,
    Home,
    Link,
    Edit,
    GraduationCap,
    Heart,
    Mail,
    Phone,
    MessageCircle,
    PlusCircle,
    ArrowLeft,
    LayoutDashboard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Firebase Configuration and Initialization ---
// REPLACE THIS OBJECT WITH YOUR OWN FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyBssAz87jCPmDNMZ5b_VVgzr0pQctvINZA",
    authDomain: "alumni-connect-system.firebaseapp.com",
    projectId: "alumni-connect-system",
    storageBucket: "alumni-connect-system.firebasestorage.app",
    messagingSenderId: "707277154710",
    appId: "1:707277154710:web:37af2bd2e1c1c94804d5b7",
    measurementId: "G-KWEBRHN9T9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Context to provide Firebase instances and user state throughout the application.
const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [dbInstance, setDbInstance] = useState(null);
    const [authInstance, setAuthInstance] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const appId = "default-app-id";

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsAuthReady(true);
        });
        setDbInstance(db);
        setAuthInstance(auth);
        return () => unsubscribe();
    }, []);

    const value = { user, dbInstance, authInstance, isAuthReady, appId };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

const useAppContext = () => {
    return useContext(AppContext);
};

// --- API Functions (Using Firestore) ---
const getUserProfile = async (db, userId, appId) => {
    if (!db || !userId || !appId) return null;
    const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, userId);
    try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            return { ...userDocSnap.data(), id: userId };
        }
    } catch (error) {
        console.error("Error fetching user profile:", error.code, error.message);
    }
    return null;
};

const createUserProfile = async (db, userId, appId, profileData) => {
    if (!db || !userId || !appId) return;
    const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, userId);
    try {
        await setDoc(userDocRef, {
            ...profileData,
            id: userId,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating user profile:", error.code, error.message);
    }
};

const updateProfile = async (db, userId, appId, profileData) => {
    if (!db || !userId || !appId) return;
    const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, userId);
    try {
        await updateDoc(userDocRef, profileData);
    } catch (error) {
        console.error("Error updating user profile:", error.code, error.message);
    }
};

// --- Enhanced Messenger Utilities ---
/**
 * Finds an existing chat between two users or creates a new one if none exists.
 * @returns {string} The ID of the chat document.
 */
const findOrCreateChat = async (db, appId, currentUserId, otherUserId) => {
    const sortedParticipants = [currentUserId, otherUserId].sort();
    const messagesRef = collection(db, `artifacts/${appId}/public/data/messages`);

    // Query for an existing chat with the same participants
    const q = query(messagesRef, where('participants', '==', sortedParticipants));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        // Chat already exists, return its ID
        return snapshot.docs[0].id;
    } else {
        // Chat does not exist, create a new one
        const newChatDoc = await addDoc(messagesRef, {
            participants: sortedParticipants,
            messages: [],
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
        });
        return newChatDoc.id;
    }
};

const ProfileHeadline = ({ name, headline, currentJob, company, role, profilePictureUrl }) => (
    <div className="flex items-center space-x-6 p-6">
        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
            {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={`${name}'s profile`} className="w-24 h-24 rounded-full object-cover" />
            ) : (
                <User size={64} className="text-blue-500" />
            )}
        </div>
        <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{name}</h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mt-1">{headline}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{currentJob} at {company}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Role: {role}</p>
        </div>
    </div>
);

const ExperienceSection = ({ experience }) => (
    <div className="space-y-4">
        <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Experience</h4>
        {experience.length > 0 ? (
            experience.map((exp, index) => (
                <div key={index} className="flex items-start space-x-4">
                    <Briefcase size={20} className="text-gray-500 dark:text-gray-400 mt-1" />
                    <div>
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100">{exp.role}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{exp.startDate} - {exp.endDate}</p>
                        {exp.description && <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{exp.description}</p>}
                    </div>
                </div>
            ))
        ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No experience added yet.</p>
        )}
    </div>
);

const EducationSection = ({ education }) => (
    <div className="space-y-4">
        <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Education</h4>
        {education.length > 0 ? (
            education.map((edu, index) => (
                <div key={index} className="flex items-start space-x-4">
                    <GraduationCap size={20} className="text-gray-500 dark:text-gray-400 mt-1" />
                    <div>
                        <h5 className="font-semibold text-gray-900 dark:text-gray-100">{edu.degree}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{edu.institution}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{edu.year}</p>
                    </div>
                </div>
            ))
        ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No education added yet.</p>
        )}
    </div>
);

const SkillsSection = ({ skills }) => (
    <div className="space-y-4">
        <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Skills</h4>
        {skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-200">{skill}</span>
                ))}
            </div>
        ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No skills added yet.</p>
        )}
    </div>
);

const ConnectionsSection = ({ connections }) => (
    <div className="space-y-4">
        <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Connections</h4>
        {connections.length > 0 ? (
            <p className="text-gray-700 dark:text-gray-300">{connections.length} connections</p>
        ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No connections yet.</p>
        )}
    </div>
);

const PasswordResetModal = ({ isOpen, onClose, onSendResetEmail }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await onSendResetEmail(email);
            setMessage('A password reset link has been sent to your email.');
        } catch (err) {
            setError(err.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                {error && <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                {message && <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 p-3 rounded-lg mb-4 text-sm">{message}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        Send Reset Link
                    </button>
                </form>
            </div>
        </div>
    );
};

// Replace your entire existing AuthModal component with this corrected one.
const AuthModal = ({ isOpen, onClose, onSignIn, onSignUp, onForgotPassword }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [isParsingResume, setIsParsingResume] = useState(false);
    const [formData, setFormData] = useState({ name: '', graduationYear: '', branch: '', skills: [] });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!supportedTypes.includes(file.type)) {
            setError('Unsupported file type. Please upload a PDF, JPG, or PNG file.');
            setResumeFile(null);
            return;
        }
        
        setResumeFile(file);
        setError('');
    };

    const handleAutofill = async () => {
        if (!resumeFile) {
            setError('Please select a resume file first.');
            return;
        }

        setIsParsingResume(true);
        setError('');
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target.result.split(',')[1];
            try {
                const parsedData = await extractResumeData(base64Data, resumeFile.type); 
                
                if (parsedData) {
                    setFormData({
                        name: parsedData.name || '',
                        graduationYear: parsedData.graduationYear || '',
                        branch: parsedData.branch || '',
                        skills: parsedData.skills || [],
                    });
                    setError('');
                } else {
                    setError('Failed to parse resume. Please fill in details manually.');
                }
            } catch (err) {
                setError('Error during resume parsing. Please fill in manually.');
                console.error('Error parsing resume:', err);
            } finally {
                setIsParsingResume(false);
            }
        };
        reader.readAsDataURL(resumeFile);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillsChange = (e) => {
        const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, skills }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await onSignIn(email, password);
            } else {
                await onSignUp(email, password, role, formData);
            }
            onClose();
        } catch (err) {
            /**
             * CHANGE 1: IMPROVED ERROR HANDLING
             * This now shows clear, user-friendly messages for common registration
             * and login errors instead of technical codes or failing silently.
             */
            let friendlyMessage = 'An unexpected error occurred. Please try again.';
            switch (err.code) {
                case 'auth/email-already-in-use':
                    friendlyMessage = 'This email address is already registered. Please try logging in or use "Forgot Password".';
                    break;
                case 'auth/weak-password':
                    friendlyMessage = 'The password is too weak. Please use at least 6 characters.';
                    break;
                case 'auth/invalid-email':
                    friendlyMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    friendlyMessage = 'Invalid email or password. Please try again.';
                    break;
                default:
                    friendlyMessage = err.message; // Fallback for other errors
                    break;
            }
            setError(friendlyMessage);
        }
    };

    if (!isOpen) return null;
    
    return (
        /**
         * CHANGE 2: MODAL LAYOUT CORRECTION
         * The modal container is now scrollable (`overflow-y-auto`) and has padding.
         * This ensures it always fits on the screen and is easily viewable,
         * even on smaller devices when the sign-up form is long.
         */
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-start overflow-y-auto z-50 p-4 pt-10">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4 mb-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isLogin ? 'Login' : 'Sign Up'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                {error && <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            required
                        />
                    </div>
                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                >
                                    <option value="student">Student</option>
                                    <option value="alumni">Alumni</option>
                                </select>
                            </div>
                            {role === 'student' && (
                                <div className="space-y-2">
                                    <label className="block text-gray-700 dark:text-gray-300">Upload Resume (Optional)</label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutofill}
                                        className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-full hover:bg-gray-300 transition-colors flex items-center justify-center disabled:opacity-50"
                                        disabled={!resumeFile || isParsingResume}
                                    >
                                        {isParsingResume ? (
                                            <>
                                                <Loader2 className="animate-spin mr-2" size={20} />
                                                Parsing...
                                            </>
                                        ) : (
                                            'Autofill from Resume'
                                        )}
                                    </button>
                                    <div className="space-y-2 pt-4">
                                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required />
                                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Graduation Year</label>
                                        <input type="number" name="graduationYear" value={formData.graduationYear} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                                        <input type="text" name="branch" value={formData.branch} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Skills (comma-separated)</label>
                                        <input type="text" name="skills" value={formData.skills?.join(', ')} onChange={handleSkillsChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>
                {isLogin && (
                    <button onClick={onForgotPassword} className="mt-4 text-sm text-blue-500 hover:underline w-full text-center">
                        Forgot Password?
                    </button>
                )}
                <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    {isLogin ? (
                        <>
                            Don't have an account?{' '}
                            <button onClick={() => { setIsLogin(false); setError(''); }} className="text-blue-500 hover:underline">Sign Up</button>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <button onClick={() => { setIsLogin(true); setError(''); }} className="text-blue-500 hover:underline">Login</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
const Chatbot = ({ isOpen, onClose }) => {
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const { user } = useAppContext();
    const chatEndRef = useRef(null);

    const API_KEY = "AIzaSyBL9jYLwNtLXxbH8BrPsc1hRKThQvvxLnI";

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleSendMessage = async () => {
        if (input.trim() === '') return;

        const newUserMessage = { role: 'user', text: input };
        setChatHistory((prev) => [...prev, newUserMessage]);
        setInput('');
        setIsTyping(true);

        const responseText = 'Oops! Something went wrong. Please try again later.';
        const prompt = `Act as an AI-driven Alumni Connect assistant for a university. The user is a ${user ? 'logged-in user' : 'guest'}. Respond to the following query: "${input}". Provide helpful, friendly advice related to a university alumni platform. Keep your response concise and professional.`;
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result && result.candidates && result.candidates.length > 0 && result.candidates[0].content) {
                const apiResponseText = result.candidates[0].content.parts[0].text;
                setChatHistory((prev) => [...prev, { role: 'bot', text: apiResponseText }]);
            } else {
                setChatHistory((prev) => [...prev, { role: 'bot', text: responseText }]);
            }
        } catch (error) {
            console.error('API call failed:', error);
            setChatHistory((prev) => [...prev, { role: 'bot', text: responseText }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-white dark:bg-gray-800 shadow-2xl rounded-xl flex flex-col p-4 transform transition-all duration-300 ease-in-out border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center pb-2 border-b dark:border-gray-700">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Ask ACBot</h3>
                <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto my-2 space-y-3 p-2">
                {chatHistory.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 text-sm italic">
                        How can I help you today?
                    </div>
                )}
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2 rounded-lg max-w-[75%] text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white dark:bg-blue-600' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="p-2 rounded-lg bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 text-sm animate-pulse">
                            Typing...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="flex items-center pt-2 border-t dark:border-gray-700">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleSendMessage}
                    className="ml-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

const ContributionModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleCopyUPI = () => {
        navigator.clipboard.writeText('admin@university.upi');
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Alumni Contribution</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">Support our alumni trust with a contribution. Scan the QR code or use the UPI ID below.</p>
                <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-inner">
                        <img src="https://placehold.co/200x200" alt="UPI QR Code" />
                    </div>
                    <div className="relative w-full">
                        <input type="text" value="admin@university.upi" readOnly className="w-full p-3 pr-12 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        <button onClick={handleCopyUPI} className="absolute right-2 top-2 p-1 text-gray-500 hover:text-blue-500">
                            <MessageCircle size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Header = ({ onNavigate, onSignIn, onSignUp, currentPage, onContributionClick, onSearch, userRole }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const { user, authInstance } = useAppContext();

    const handleSignOut = async () => {
        try {
            await signOut(authInstance);
            onNavigate('home');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const handleAuthModalClose = () => {
        setIsAuthModalOpen(false);
    };

    const handleForgotPassword = () => {
        setIsAuthModalOpen(false);
        setIsPasswordResetModalOpen(true);
    };

    const handleSendResetEmail = async (email) => {
        await sendPasswordResetEmail(authInstance, email);
    };

    const handleSearchSubmit = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            onSearch(searchInput);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-sm">
                <div className="container mx-auto p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Alumni Connect</h1>
                    <div className="hidden md:flex flex-1 mx-8">
                        <div className="relative w-full max-w-md">
                            <input
                                type="text"
                                placeholder="Search alumni, jobs, events..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleSearchSubmit}
                                className="w-full p-2 pl-10 pr-10 rounded-full border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                            />
                            <button onClick={handleSearchSubmit} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
                                <Search size={20} />
                            </button>
                        </div>
                    </div>
                    <nav className="hidden md:flex space-x-6 text-gray-700 dark:text-gray-300 items-center">
                        <button onClick={() => onNavigate('home')} className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center ${currentPage === 'home' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}><Home size={18} className="mr-1" />Home</button>
                        <button onClick={() => onNavigate('alumni')} className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center ${currentPage === 'alumni' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}><Users size={18} className="mr-1" />Alumni</button>
                        {user && (
                            <>
                                <button onClick={() => onNavigate('dashboard')} className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center ${currentPage === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}><LayoutDashboard size={18} className="mr-1" />Dashboard</button>
                                <button onClick={() => onNavigate('connections')} className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center ${currentPage === 'connections' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}`}><Link size={18} className="mr-1" />Connections</button>
                                {userRole === 'alumni' && (
                                    <button onClick={() => onContributionClick()} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"><Heart size={18} className="mr-1" />Contribute</button>
                                )}
                                <div className="relative group">
                                    <button onClick={() => onNavigate('profile')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                        <User size={24} />
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out z-50">
                                        <button onClick={() => onNavigate('profile')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">My Profile</button>
                                        <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">Sign Out</button>
                                    </div>
                                </div>
                            </>
                        )}
                        {!user && (
                            <button onClick={() => setIsAuthModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                                Login / Sign Up
                            </button>
                        )}
                    </nav>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <Menu size={24} />
                    </button>
                </div>
                {isMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-gray-900 shadow-md">
                        <nav className="flex flex-col space-y-2 p-4 text-gray-700 dark:text-gray-300">
                            <button onClick={() => onNavigate('home')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left p-2 rounded-md flex items-center"><Home size={18} className="mr-2" />Home</button>
                            <button onClick={() => onNavigate('alumni')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left p-2 rounded-md flex items-center"><Users size={18} className="mr-2" />Alumni</button>
                            {user && (
                                <>
                                    <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left p-2 rounded-md flex items-center"><LayoutDashboard size={18} className="mr-2" />Dashboard</button>
                                    <button onClick={() => onNavigate('connections')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left p-2 rounded-md flex items-center"><Link size={18} className="mr-2" />Connections</button>
                                    {userRole === 'alumni' && (
                                        <button onClick={() => onContributionClick()} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left p-2 rounded-md flex items-center"><Heart size={18} className="mr-2" />Contribute</button>
                                    )}
                                    <button onClick={() => onNavigate('profile')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left p-2 rounded-md flex items-center">
                                        <User size={18} className="mr-2" />
                                        My Profile
                                    </button>
                                    <button onClick={handleSignOut} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left p-2 rounded-md flex items-center">
                                        <LogOut size={18} className="mr-2" />
                                        Sign Out
                                    </button>
                                </>
                            )}
                            {!user && (
                                <button onClick={() => setIsAuthModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                                    Login / Sign Up
                                </button>
                            )}
                        </nav>
                    </div>
                )}
            </header>
            <AuthModal isOpen={isAuthModalOpen} onClose={handleAuthModalClose} onSignIn={onSignIn} onSignUp={onSignUp} onForgotPassword={handleForgotPassword} />
            <PasswordResetModal isOpen={isPasswordResetModalOpen} onClose={() => setIsPasswordResetModalOpen(false)} onSendResetEmail={handleSendResetEmail} />
        </>
    );
};

const RecentItem = ({ title, description, type }) => {
    const icon = type === 'job' ? <Briefcase size={20} /> : <Calendar size={20} />;
    const color = type === 'job' ? 'text-green-500' : 'text-purple-500';
    return (
        <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className={`p-2 rounded-full bg-opacity-20 ${color} bg-current`}>
                {icon}
            </div>
            <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
        </div>
    );
};

// const FeaturedAlumniCard = ({ name, headline, role, profilePictureUrl, onConnect }) => (
//     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center text-center transition-all hover:shadow-2xl hover:scale-105">
//         <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
//             {profilePictureUrl ? (
//                 <img src={profilePictureUrl} alt={`${name}'s profile`} className="w-full h-full object-cover" />
//             ) : (
//                 <User size={48} className="text-gray-500" />
//             )}
//         </div>
//         <h4 className="text-xl font-bold mt-4 text-gray-900 dark:text-gray-100">{name}</h4>
//         <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{headline || role}</p>
//         <button onClick={onConnect} className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
//             Connect
//         </button>
//     </div>
// );

const HomePage = ({ onNavigate }) => {
    const { user, dbInstance, appId, isAuthReady } = useAppContext();
    const [recentItems, setRecentItems] = useState([]);
    const [featuredAlumni, setFeaturedAlumni] = useState([]);

    useEffect(() => {
        if (!dbInstance || !appId || !isAuthReady) return;

        const fetchRecentItems = async () => {
            try {
                const jobsCollectionRef = collection(dbInstance, `artifacts/${appId}/public/data/jobs`);
                const eventsCollectionRef = collection(dbInstance, `artifacts/${appId}/public/data/events`);

                const [jobsSnapshot, eventsSnapshot] = await Promise.all([
                    getDocs(jobsCollectionRef),
                    getDocs(eventsCollectionRef)
                ]);

                const recentJobs = jobsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'job' }));
                const recentEvents = eventsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, type: 'event' }));

                setRecentItems(
                    [...recentJobs, ...recentEvents]
                        .sort((a, b) => (b.postedAt?.toMillis() || 0) - (a.postedAt?.toMillis() || 0))
                        .slice(0, 3)
                );
            } catch (error) {
                console.error("Error fetching recent items:", error);
            }
        };

        const fetchFeaturedAlumni = async () => {
            try {
                const alumniCollectionRef = collection(dbInstance, `artifacts/${appId}/public/data/users`);
                const alumniSnapshot = await getDocs(alumniCollectionRef);
                const alumniData = alumniSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                    .filter(alumni => alumni.role === 'alumni');
                setFeaturedAlumni(alumniData.slice(0, 3));
            } catch (error) {
                console.error("Error fetching featured alumni:", error);
            }
        };

        fetchRecentItems();
        fetchFeaturedAlumni();

    }, [dbInstance, appId, isAuthReady]);

    return (
        <div className="space-y-12 p-4 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-16 rounded-3xl shadow-xl animate-fade-in-down">
                <h2 className="text-5xl font-extrabold leading-tight">Alumni Connect</h2>
                <p className="mt-4 text-xl font-light opacity-90">A Comprehensive Alumni Management System</p>
                <button onClick={() => onNavigate(user ? 'dashboard' : 'alumni')} className="mt-8 px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-full shadow-lg hover:bg-gray-100 transition-all transform hover:scale-105">
                    {user ? 'Go to My Dashboard' : 'Explore Alumni'}
                </button>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in-up">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transition-all hover:shadow-2xl hover:scale-105">
                    <Users size={64} className="text-blue-500 mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Alumni Directory</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Find and connect with fellow alumni based on shared interests, branch, or profession.</p>
                    <button onClick={() => onNavigate('alumni')} className="mt-4 text-blue-500 hover:underline font-medium">Browse Alumni</button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transition-all hover:shadow-2xl hover:scale-105">
                    <Briefcase size={64} className="text-green-500 mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Job Portal</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Discover and post exclusive job and internship opportunities for students and alumni.</p>
                    <button onClick={() => onNavigate('dashboard')} className="mt-4 text-green-500 hover:underline font-medium">View Jobs</button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transition-all hover:shadow-2xl hover:scale-105">
                    <Calendar size={64} className="text-purple-500 mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Event Management</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Stay informed about upcoming reunions, webinars, and guest lectures.</p>
                    <button onClick={() => onNavigate('dashboard')} className="mt-4 text-purple-500 hover:underline font-medium">See Events</button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 flex flex-col items-center text-center transition-all hover:shadow-2xl hover:scale-105">
                    <MessageSquare size={64} className="text-yellow-500 mb-4" />
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">AI Chatbot</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Get 24/7 support and personalized guidance from our integrated AI assistant.</p>
                    <button onClick={() => onNavigate('Chatbot')} className="mt-4 text-yellow-500 hover:underline font-medium">Try the Chatbot</button>
                </div>
            </section>

            <section className="text-left">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Recent Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recentItems.length > 0 ? (
                        recentItems.map(item => <RecentItem key={item.id} {...item} />)
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No recent activity to display.</p>
                    )}
                </div>
            </section>

            {/* <section className="text-left">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Featured Alumni</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuredAlumni.length > 0 ? (
                        featuredAlumni.map(alumni => (
                            <FeaturedAlumniCard key={alumni.id} {...alumni} onConnect={() => onNavigate('alumni')} />
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No featured alumni available.</p>
                    )}
                </div>
            </section> */}
        </div>
    );
};

const Dashboard = ({ onNavigate, searchTerm }) => {
    const { dbInstance, appId, user, isAuthReady } = useAppContext();
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [events, setEvents] = useState([]);
    const [posts, setPosts] = useState([]);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        if (!dbInstance || !appId || !isAuthReady) return;

        const usersQuery = query(collection(dbInstance, `artifacts/${appId}/public/data/users`));
        const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
            setUsers(snapshot.docs.map(doc => doc.data()));
        }, (error) => console.error("Error fetching users:", error.code, error.message));

        const jobsQuery = query(collection(dbInstance, `artifacts/${appId}/public/data/jobs`));
        const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
            setJobs(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        }, (error) => console.error("Error fetching jobs:", error.code, error.message));

        const eventsQuery = query(collection(dbInstance, `artifacts/${appId}/public/data/events`));
        const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
            setEvents(snapshot.docs.map(doc => doc.data()));
        }, (error) => console.error("Error fetching events:", error.code, error.message));

        const postsQuery = query(collection(dbInstance, `artifacts/${appId}/public/data/posts`), orderBy('postedAt', 'desc'));
        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        }, (error) => console.error("Error fetching posts:", error.code, error.message));

        return () => {
            unsubscribeUsers();
            unsubscribeJobs();
            unsubscribeEvents();
            unsubscribePosts();
        };
    }, [dbInstance, appId, isAuthReady]);

    const stats = [
        { name: 'Alumni', count: users.filter(u => u.role === 'alumni').length, color: '#4CAF50' },
        { name: 'Students', count: users.filter(u => u.role === 'student').length, color: '#2196F3' },
        { name: 'Job Postings', count: jobs.length, color: '#FFC107' },
        { name: 'Upcoming Events', count: events.length, color: '#9C27B0' },
    ];

    return (
        <div className="space-y-8 p-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Dashboard</h2>
            {user && (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow-inner text-sm text-gray-700 dark:text-gray-300">
                    <p>Your unique User ID is: <code className="font-mono text-blue-600 dark:text-blue-400">{user.uid}</code></p>
                </div>
            )}

            <div className="flex space-x-4 border-b dark:border-gray-700">
                <button onClick={() => setActiveTab('summary')} className={`py-2 px-4 font-semibold ${activeTab === 'summary' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Summary</button>
                <button onClick={() => setActiveTab('jobs')} className={`py-2 px-4 font-semibold ${activeTab === 'jobs' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Jobs</button>
                <button onClick={() => setActiveTab('events')} className={`py-2 px-4 font-semibold ${activeTab === 'events' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Events</button>
                <button onClick={() => setActiveTab('posts')} className={`py-2 px-4 font-semibold ${activeTab === 'posts' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Posts</button>
                {/* <button onClick={() => onNavigate('messenger')} className="py-2 px-4 font-semibold text-gray-500 hover:text-blue-600">Messenger</button> */}
            </div>

            {activeTab === 'summary' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">User Statistics</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.slice(0, 2)}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="#3B82F6" barSize={40} radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Latest Job Postings</h3>
                        <ul className="space-y-4">
                            {jobs.slice(0, 5).map((job, index) => (
                                <li key={index} className="flex items-start space-x-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                                    <Briefcase size={20} className="text-blue-500 mt-1" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{job.title}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{job.company} - {job.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {activeTab === 'jobs' && <Jobs searchTerm={searchTerm} />}
            {activeTab === 'events' && <Events searchTerm={searchTerm} />}
            {activeTab === 'posts' && <MyPosts searchTerm={searchTerm} />}
        </div>
    );
};


// Replace the entire old extractResumeData function with this one.
// const extractResumeData = async (base64Data, mimeType) => {
//     // FIX 1: Add your Google AI API Key here.
//     const API_KEY = "AIzaSyBL9jYLwNtLXxbH8BrPsc1hRKThQvvxLnI"; 
//     const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

//     if (API_KEY === "AIzaSyBL9jYLwNtLXxbH8BrPsc1hRKThQvvxLnI") {
//         console.error("Google AI API Key is missing.");
//         return null;
//     }

//     const prompt = "Extract the following details from this resume in JSON format: name, graduationYear (as a number), branch, and skills (as an array of strings). If a value is not found, omit it or set it to null.";

//     const payload = {
//         contents: [
//             {
//                 role: "user",
//                 parts: [
//                     { text: prompt },
//                     {
//                         inlineData: {
//                             mimeType: "image/png", // This is always "image/png"
//                             data: base64Data
// }
//                     }
//                 ]
//             }
//         ],
//         generationConfig: {
//             responseMimeType: "application/json",
//             responseSchema: {
//                 type: "OBJECT",
//                 properties: {
//                     name: { "type": "STRING" },
//                     graduationYear: { "type": "NUMBER" },
//                     branch: { "type": "STRING" },
//                     skills: { "type": "ARRAY", "items": { "type": "STRING" } }
//                 }
//             }
//         }
//     };

//     try {
//         const response = await fetch(API_URL, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(payload)
//         });

//         if (!response.ok) {
//             const errorBody = await response.text();
//             console.error(`API Error: ${response.status} ${response.statusText}`, errorBody);
//             return null;
//         }
        
//         // Gemini API with responseSchema wraps the result in `candidates[0].content.parts[0].text` which is a JSON string
//         const result = await response.json();
//         const jsonString = result.candidates[0].content.parts[0].text;
//         return JSON.parse(jsonString);

//     } catch (error) {
//         console.error("Error calling AI for resume parsing:", error);
//         return null;
//     }
// };


const extractResumeData = async (base64Data, mimeType) => {
    // You have correctly placed your API key here.
    const API_KEY = "AIzaSyBL9jYLwNtLXxbH8BrPsc1hRKThQvvxLnI"; 
    
    // Using a stable, recent model
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    // The problematic "if" block has been removed.

    const prompt = "Analyze this resume. Extract the following details in a valid JSON format: 'name' (string), 'graduationYear' (number), 'branch' (string), and 'skills' (array of strings). If a value cannot be found, set it to null.";
    
    const payload = {
        contents: [{
            parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Data } }]
        }],
        generation_config: {
            response_mime_type: "application/json",
        }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error("--- Google AI API Error ---");
            console.error("Status:", response.status, response.statusText);
            console.error("Response Body:", responseData);
            return null;
        }

        if (!responseData.candidates || responseData.candidates.length === 0) {
            console.error("Google AI API did not return any candidates. Response:", responseData);
            return null;
        }

        const jsonString = responseData.candidates[0].content.parts[0].text;
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("A network error occurred or the response was not valid JSON. Error:", error);
        return null;
    }
};


const getAIMatchScore = async (student, alumni) => {
    const API_KEY = "AIzaSyBL9jYLwNtLXxbH8BrPsc1hRKThQvvxLnI";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;

    if (!student || !alumni || alumni.role !== 'alumni') {
        return 0;
    }

    const prompt = `
    You are an expert alumni matching algorithm. Your task is to analyze a student's profile and an alumni's profile and generate a numerical match score from 0 to 10. The score should be based on how well the alumni can mentor the student, considering their career field, educational background, and skills.

    Student Profile:
    - Role: ${student.role}
    - Branch: ${student.branch}
    - Skills: ${student.skills?.join(', ') || 'N/A'}
    - Looking for: Mentorship and career advice in a field similar to the alumni.

    Alumni Profile:
    - Role: ${alumni.role}
    - Branch: ${alumni.branch}
    - Current Job: ${alumni.currentJob} at ${alumni.company}
    - Skills: ${alumni.skills?.join(', ') || 'N/A'}

    Instructions:
    - Return a single integer score from 0 to 10.
    - A score of 10 means a perfect match (e.g., same branch, overlapping skills, relevant job experience).
    - A score of 0 means no match (e.g., completely different fields, no shared skills).
    - Be strict in your scoring. Only return a number. Do not include any other text or explanation.

    Match Score:
    `;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            return 0;
        }

        const result = await response.json();
        const responseText = result.candidates[0].content.parts[0].text;
        const score = parseInt(responseText.trim(), 10);

        if (!isNaN(score) && score >= 0 && score <= 10) {
            return score;
        } else {
            console.error("AI returned an invalid score:", responseText);
            return 0;
        }
    } catch (error) {
        console.error("Error calling AI for match score:", error);
        return 0;
    }
};

const AlumniDirectory = ({ searchTerm }) => {
    const { dbInstance, appId, user, isAuthReady } = useAppContext();
    const [profiles, setProfiles] = useState([]);
    const [filters, setFilters] = useState({ graduationYear: '', branch: '' });
    const [myProfile, setMyProfile] = useState(null);
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!dbInstance || !appId || !isAuthReady) return;

        const fetchAndScoreProfiles = async () => {
            setLoading(true);
            try {
                const myProfileData = user ? await getUserProfile(dbInstance, user.uid, appId) : null;
                setMyProfile(myProfileData);

                const profilesQuery = collection(dbInstance, `artifacts/${appId}/public/data/users`);
                const snapshot = await getDocs(profilesQuery);
                let alumniData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                if (myProfileData?.role === 'student') {
                    const scoredProfiles = await Promise.all(
                        alumniData.filter(profile => profile.role === 'alumni').map(async (profile) => {
                            const score = await getAIMatchScore(myProfileData, profile);
                            return { ...profile, aiMatchScore: score };
                        })
                    );
                    scoredProfiles.sort((a, b) => (b.aiMatchScore || 0) - (a.aiMatchScore || 0));
                    setProfiles(scoredProfiles);
                } else {
                    setProfiles(alumniData.filter(profile => profile.role === 'alumni'));
                }
            } catch (error) {
                console.error("Error fetching or scoring profiles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndScoreProfiles();

        if (user) {
            const connectionsDocRef = doc(dbInstance, `artifacts/${appId}/public/data/connections`, user.uid);
            const unsubscribeConnections = onSnapshot(connectionsDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setConnections(docSnap.data().connectedTo || []);
                } else {
                    setConnections([]);
                }
            }, (error) => console.error("Error fetching connections:", error.code, error.message));
            return () => unsubscribeConnections();
        }
    }, [dbInstance, appId, isAuthReady, user]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleConnect = async (targetUserId) => {
        if (!user) {
            setMessage("You must be logged in to send a connection request.");
            return;
        }
        const myConnectionsRef = doc(dbInstance, `artifacts/${appId}/public/data/connections`, user.uid);
        const theirConnectionsRef = doc(dbInstance, `artifacts/${appId}/public/data/connections`, targetUserId);

        try {
            await setDoc(myConnectionsRef, { connectedTo: [...new Set([...connections, targetUserId])] }, { merge: true });
            const theirConnectionsSnap = await getDoc(theirConnectionsRef);
            const theirConnections = theirConnectionsSnap.exists() ? theirConnectionsSnap.data().connectedTo : [];
            await setDoc(theirConnectionsRef, { connectedTo: [...new Set([...theirConnections, user.uid])] }, { merge: true });

            setMessage("Connection request sent successfully!");
        } catch (error) {
            setMessage("Failed to send connection request. Please try again.");
            console.error("Error connecting:", error);
        }
    };

    const filteredProfiles = profiles.filter(profile => {
        const matchesSearch = searchTerm === '' ||
            profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profile.currentJob?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profile.skills?.some(skill => skill?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesYear = filters.graduationYear === '' || profile.graduationYear?.toString() === filters.graduationYear;
        const matchesBranch = filters.branch === '' || profile.branch?.toLowerCase().includes(filters.branch.toLowerCase());
        return matchesSearch && matchesYear && matchesBranch;
    });

    const uniqueBranches = [...new Set(profiles.map(p => p.branch).filter(Boolean))];
    const uniqueYears = [...new Set(profiles.map(p => p.graduationYear).filter(Boolean))].sort((a, b) => b - a);

    return (
        <div className="space-y-8 p-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Alumni Directory</h2>
            {loading && (
              <div className="flex flex-col items-center justify-center min-h-[30vh] text-center">
                <Loader2 className="animate-spin mr-2" size={32} />
              <span className="text-xl text-gray-600 dark:text-gray-400 mt-2">Generating AI match scores...</span>
              </div>
            )}
            
            {!loading && message && (
                <div className="p-4 rounded-xl bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">
                    {message}
                </div>
            )}
            {!loading && myProfile?.role === 'student' && filteredProfiles.length > 0 && (
                <div className="bg-yellow-50 dark:bg-gray-700 rounded-xl shadow-lg p-6">
                    <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">Top Mentor Matches for you!</h3>
                    <p className="mb-4 text-gray-700 dark:text-gray-300">These profiles are sorted by an AI-generated match score based on your profile.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProfiles.slice(0, 3).map((profile, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col items-center text-center transition-all hover:shadow-2xl">
                                <User size={48} className="text-yellow-500" />
                                <h4 className="text-xl font-bold mt-2 text-gray-900 dark:text-gray-100">{profile.name}</h4>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{profile.currentJob}</p>
                                <div className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                                    <span className="font-semibold">AI Match Score:</span> {profile.aiMatchScore || 'N/A'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!loading && (
                <>
                    <div className="flex flex-col md:flex-row gap-4">
                        <select
                            name="graduationYear"
                            value={filters.graduationYear}
                            onChange={handleFilterChange}
                            className="p-4 rounded-xl border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        >
                            <option value="">Filter by Year</option>
                            {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                        <select
                            name="branch"
                            value={filters.branch}
                            onChange={handleFilterChange}
                            className="p-4 rounded-xl border dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                        >
                            <option value="">Filter by Branch</option>
                            {uniqueBranches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProfiles.length > 0 ? (
                            filteredProfiles.map((profile, index) => (
                                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col transition-all hover:shadow-2xl">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="p-2 bg-gray-200 rounded-full">
                                            <User size={32} className="text-gray-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.name}</h3>
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{profile.headline || profile.role}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-left">
                                        <p className="text-gray-800 dark:text-gray-200 flex items-center"><Briefcase size={16} className="mr-2 text-gray-500" />{profile.currentJob} at {profile.company}</p>
                                        <p className="text-gray-800 dark:text-gray-200 flex items-center"><GraduationCap size={16} className="mr-2 text-gray-500" />{profile.branch}, Graduated {profile.graduationYear}</p>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {profile.skills?.slice(0, 3).map((skill, i) => (
                                                <span key={i} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300">{skill}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleConnect(profile.id)}
                                        disabled={!user || user.uid === profile.id || connections.includes(profile.id)}
                                        className={`mt-4 w-full px-4 py-2 text-white font-semibold rounded-full transition-colors ${!user || user.uid === profile.id || connections.includes(profile.id) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {connections.includes(profile.id) ? 'Connected' : 'Connect'}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 italic text-lg">No alumni profiles found.</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const JobApplicationModal = ({ isOpen, onClose, onApply, jobTitle }) => {
    const [coverLetter, setCoverLetter] = useState('');
    const { user } = useAppContext();

    const handleSubmit = (e) => {
        e.preventDefault();
        onApply({ coverLetter, applicantEmail: user.email });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Apply for {jobTitle}</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Cover Letter</label>
                        <textarea
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            className="w-full p-3 rounded-lg border h-40 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            placeholder="Tell us why you're a great fit for this role..."
                            required
                        />
                    </div>
                    <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        Submit Application
                    </button>
                </form>
            </div>
        </div>
    );
};

const Jobs = ({ searchTerm }) => {
    const { dbInstance, appId, user, isAuthReady } = useAppContext();
    const [jobs, setJobs] = useState([]);
    const [myProfile, setMyProfile] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [currentJob, setCurrentJob] = useState(null);
    const [jobTitle, setJobTitle] = useState('');
    const [jobCompany, setJobCompany] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!dbInstance || !appId || !isAuthReady || !user) return;

        const jobsQuery = query(collection(dbInstance, `artifacts/${appId}/public/data/jobs`));
        const unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setJobs(jobsData);
        }, (error) => console.error("Error fetching jobs:", error.code, error.message));

        getUserProfile(dbInstance, user.uid, appId).then(setMyProfile);

        return () => unsubscribeJobs();
    }, [dbInstance, appId, user, isAuthReady]);

    const handlePostJob = async (e) => {
        e.preventDefault();
        if (!dbInstance || !appId || !user || !myProfile || myProfile.role !== 'alumni') {
            setMessage('You must be a verified alumni to post a job.');
            return;
        }
        try {
            await addDoc(collection(dbInstance, `artifacts/${appId}/public/data/jobs`), {
                title: jobTitle,
                company: jobCompany,
                description: jobDescription,
                postedBy: myProfile.name,
                postedById: user.uid,
                postedAt: serverTimestamp(),
            });
            setMessage('Job posted successfully!');
            setIsPostModalOpen(false);
            setJobTitle('');
            setJobCompany('');
            setJobDescription('');
        } catch (error) {
            console.error("Error posting job:", error);
            setMessage('Failed to post job. Please try again.');
        }
    };

    const handleApplyJob = async (applicationData) => {
        if (!user || myProfile?.role !== 'student' || !currentJob) {
            setMessage('You must be a logged-in student to apply for a job.');
            return;
        }
        try {
            const applicationsCollectionRef = collection(dbInstance, `artifacts/${appId}/public/data/jobs/${currentJob.id}/applications`);
            await addDoc(applicationsCollectionRef, {
                applicantId: user.uid,
                applicantName: myProfile.name,
                appliedAt: serverTimestamp(),
                ...applicationData
            });
            setMessage(`Application for job "${currentJob.title}" submitted successfully!`);
            setIsApplyModalOpen(false);
        } catch (error) {
            setMessage("Failed to submit application. Please try again.");
            console.error("Error submitting application:", error);
        }
    };

    const filteredJobs = jobs.filter(job => job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase()) || job.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Jobs</h2>
                {myProfile?.role === 'alumni' && (
                    <button onClick={() => setIsPostModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        Post a Job
                    </button>
                )}
            </div>
            {message && (
                <div className="p-4 rounded-xl bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">
                    {message}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.length > 0 ? (
                    filteredJobs.map((job) => (
                        <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col transition-all hover:shadow-2xl">
                            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{job.title}</h3>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{job.company}</p>
                            <p className="mt-2 flex-1 text-gray-600 dark:text-gray-400">{job.description}</p>
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">Posted by: {job.postedBy}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-600">Posted on: {job.postedAt?.toDate().toLocaleDateString()}</p>
                            <button
                                onClick={() => { setCurrentJob(job); setIsApplyModalOpen(true); }}
                                disabled={myProfile?.role !== 'student'}
                                className={`mt-4 px-4 py-2 text-white rounded-full font-semibold transition-colors ${myProfile?.role === 'student' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`}
                            >
                                Apply Now
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-500 dark:text-gray-400 italic text-lg">No job postings available.</div>
                )}
            </div>

            {isPostModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Post a New Job</h3>
                            <button onClick={() => setIsPostModalOpen(false)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handlePostJob} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                                <input
                                    type="text"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1">Company</label>
                                <input
                                    type="text"
                                    value={jobCompany}
                                    onChange={(e) => setJobCompany(e.target.value)}
                                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    className="w-full p-3 rounded-lg border h-32 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                                Submit Job
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <JobApplicationModal
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                onApply={handleApplyJob}
                jobTitle={currentJob?.title}
            />
        </div>
    );
};

const Events = ({ searchTerm }) => {
    const { dbInstance, appId, user, isAuthReady } = useAppContext();
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [message, setMessage] = useState('');
    const [myProfile, setMyProfile] = useState(null);

    useEffect(() => {
        if (!dbInstance || !appId || !isAuthReady) return;

        const eventsQuery = query(collection(dbInstance, `artifacts/${appId}/public/data/events`));
        const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
            setEvents(snapshot.docs.map(doc => doc.data()));
        }, (error) => console.error("Error fetching events:", error.code, error.message));

        if (user) {
            getUserProfile(dbInstance, user.uid, appId).then(setMyProfile);
        }
        return () => unsubscribe();
    }, [dbInstance, appId, isAuthReady, user]);

    const handlePostEvent = async (e) => {
        e.preventDefault();
        if (!dbInstance || !appId || !user || !myProfile || (myProfile.role !== 'alumni' && myProfile.role !== 'admin')) {
            setMessage('You must be an administrator or alumni to post an event.');
            return;
        }
        try {
            await addDoc(collection(dbInstance, `artifacts/${appId}/public/data/events`), {
                title: eventTitle,
                description: eventDescription,
                date: eventDate,
                location: eventLocation,
                organizer: myProfile.name,
                organizerId: user.uid,
                postedAt: serverTimestamp(),
            });
            setMessage('Event posted successfully!');
            setIsModalOpen(false);
            setEventTitle('');
            setEventDescription('');
            setEventDate('');
            setEventLocation('');
        } catch (error) {
            console.error("Error posting event:", error);
            setMessage('Failed to post event. Please try again.');
        }
    };

    const filteredEvents = events.filter(event => event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.description.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Events</h2>
                {myProfile && (myProfile.role === 'alumni' || myProfile.role === 'admin') && (
                    <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        Organize an Event
                    </button>
                )}
            </div>
            {message && (
                <div className="p-4 rounded-xl bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">
                    {message}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map((event, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col transition-all hover:shadow-2xl">
                            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{event.title}</h3>
                            <p className="mt-2 flex-1 text-gray-600 dark:text-gray-400">{event.description}</p>
                            <div className="mt-4 space-y-1">
                                <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center">
                                    <Calendar size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                                    Date: {event.date}
                                </p>
                                <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center">
                                    <Info size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                                    Location: {event.location}
                                </p>
                                <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center">
                                    <User size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
                                    Organizer: {event.organizer}
                                </p>
                            </div>
                            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors">
                                Register
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-500 dark:text-gray-400 italic text-lg">No upcoming events.</div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organize a New Event</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handlePostEvent} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1">Event Title</label>
                                <input
                                    type="text"
                                    value={eventTitle}
                                    onChange={(e) => setEventTitle(e.target.value)}
                                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={eventDescription}
                                    onChange={(e) => setEventDescription(e.target.value)}
                                    className="w-full p-3 rounded-lg border h-32 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={eventLocation}
                                    onChange={(e) => setEventLocation(e.target.value)}
                                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                                Submit Event
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


// const Events = ({ searchTerm }) => {
//     const { dbInstance, appId, user, isAuthReady } = useAppContext();
//     const [events, setEvents] = useState([]);
//     const [myRegistrations, setMyRegistrations] = useState([]); // To track user's registrations
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [eventTitle, setEventTitle] = useState('');
//     const [eventDescription, setEventDescription] = useState('');
//     const [eventDate, setEventDate] = useState('');
//     const [eventLocation, setEventLocation] = useState('');
//     const [message, setMessage] = useState('');
//     const [myProfile, setMyProfile] = useState(null);

//     useEffect(() => {
//         if (!dbInstance || !appId || !isAuthReady) return;

//         const eventsQuery = query(collection(dbInstance, `artifacts/${appId}/public/data/events`));
//         const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
//             const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//             setEvents(eventsData);
//         }, (error) => console.error("Error fetching events:", error.code, error.message));

//         if (user) {
//             getUserProfile(dbInstance, user.uid, appId).then(setMyProfile);

//             // Fetch IDs of events this user has registered for
//             const eventsCollectionRef = collection(dbInstance, `artifacts/${appId}/public/data/events`);
//             const unsubscribeRegs = onSnapshot(eventsCollectionRef, (snapshot) => {
//                 let registeredEventIds = [];
//                 const promises = snapshot.docs.map(eventDoc => {
//                     const userRegDocRef = doc(dbInstance, `artifacts/${appId}/public/data/events/${eventDoc.id}/registrations`, user.uid);
//                     return getDoc(userRegDocRef).then(docSnap => {
//                         if (docSnap.exists()) {
//                             return eventDoc.id;
//                         }
//                         return null;
//                     });
//                 });
//                 Promise.all(promises).then(results => {
//                     setMyRegistrations(results.filter(id => id !== null));
//                 });
//             });
            
//             return () => { unsubscribe(); unsubscribeRegs(); };
//         }
//         return () => unsubscribe();
//     }, [dbInstance, appId, isAuthReady, user]);

//     const handleRegister = async (eventId, title) => {
//         if (!user || !myProfile) {
//             setMessage("You must be logged in to register.");
//             return;
//         }

//         const registrationRef = doc(dbInstance, `artifacts/${appId}/public/data/events/${eventId}/registrations`, user.uid);

//         try {
//             await setDoc(registrationRef, {
//                 applicantId: user.uid,
//                 applicantName: myProfile.name,
//                 applicantEmail: user.email,
//                 eventTitle: title,
//                 registeredAt: serverTimestamp()
//             });
            
//             setMessage(`Successfully registered for "${title}"! Check your email for a confirmation.`);
//         } catch (error) {
//             console.error("Error registering for event:", error);
//             setMessage("Registration failed. Please try again.");
//         }
//     };

//     const handlePostEvent = async (e) => {
//         e.preventDefault();
//         if (!dbInstance || !appId || !user || !myProfile || (myProfile.role !== 'alumni' && myProfile.role !== 'admin')) {
//             setMessage('You must be an administrator or alumni to post an event.');
//             return;
//         }
//         try {
//             await addDoc(collection(dbInstance, `artifacts/${appId}/public/data/events`), {
//                 title: eventTitle,
//                 description: eventDescription,
//                 date: eventDate,
//                 location: eventLocation,
//                 organizer: myProfile.name,
//                 organizerId: user.uid,
//                 postedAt: serverTimestamp(),
//                 registrationCount: 0,
//             });
//             setMessage('Event posted successfully!');
//             setIsModalOpen(false);
//             setEventTitle('');
//             setEventDescription('');
//             setEventDate('');
//             setEventLocation('');
//         } catch (error) {
//             console.error("Error posting event:", error);
//             setMessage('Failed to post event. Please try again.');
//         }
//     };

//     const filteredEvents = events.filter(event => event.title.toLowerCase().includes(searchTerm.toLowerCase()) || event.description.toLowerCase().includes(searchTerm.toLowerCase()) || event.location.toLowerCase().includes(searchTerm.toLowerCase()));

//     return (
//         <div className="space-y-8 p-4">
//             <div className="flex justify-between items-center">
//                 <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Events</h2>
//                 {myProfile && (myProfile.role === 'alumni' || myProfile.role === 'admin') && (
//                     <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
//                         Organize an Event
//                     </button>
//                 )}
//             </div>
//             {message && (
//                 <div className="p-4 rounded-xl bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">
//                     {message}
//                 </div>
//             )}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                 {filteredEvents.length > 0 ? (
//                     filteredEvents.map((event) => {
//                         const isRegistered = myRegistrations.includes(event.id);
//                         return (
//                         <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col transition-all hover:shadow-2xl">
//                             <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{event.title}</h3>
//                             <p className="mt-2 flex-1 text-gray-600 dark:text-gray-400">{event.description}</p>
//                             <div className="mt-4 space-y-1">
//                                 <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center"><Calendar size={16} className="mr-2 text-gray-500 dark:text-gray-400" />Date: {event.date}</p>
//                                 <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center"><Info size={16} className="mr-2 text-gray-500 dark:text-gray-400" />Location: {event.location}</p>
//                                 <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center"><User size={16} className="mr-2 text-gray-500 dark:text-gray-400" />Organizer: {event.organizer}</p>
//                                 <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center pt-2"><Users size={16} className="mr-2 text-green-500 dark:text-green-400" />Registrations: {event.registrationCount || 0}</p>
//                             </div>
//                             <button 
//                                 onClick={() => handleRegister(event.id, event.title)}
//                                 disabled={!user || isRegistered}
//                                 className={`mt-4 px-4 py-2 text-white rounded-full font-semibold transition-colors ${!user || isRegistered ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
//                             >
//                                 {isRegistered ? 'Registered' : 'Register Now'}
//                             </button>
//                         </div>
//                     )})
//                 ) : (
//                     <div className="col-span-full text-center text-gray-500 dark:text-gray-400 italic text-lg">No upcoming events.</div>
//                 )}
//             </div>
//             {isModalOpen && (
//                 <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
//                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4">
//                         <div className="flex justify-between items-center mb-6">
//                             <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organize a New Event</h3>
//                             <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"><X size={24} /></button>
//                         </div>
//                         <form onSubmit={handlePostEvent} className="space-y-4">
//                             <div><label className="block text-gray-700 dark:text-gray-300 mb-1">Event Title</label><input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /></div>
//                             <div><label className="block text-gray-700 dark:text-gray-300 mb-1">Description</label><textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} className="w-full p-3 rounded-lg border h-32 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /></div>
//                             <div><label className="block text-gray-700 dark:text-gray-300 mb-1">Date</label><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /></div>
//                             <div><label className="block text-gray-700 dark:text-gray-300 mb-1">Location</label><input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required /></div>
//                             <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">Submit Event</button>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

const MyPosts = ({ searchTerm }) => {
    const { dbInstance, appId, user, isAuthReady } = useAppContext();
    const [posts, setPosts] = useState([]);
    const [myProfile, setMyProfile] = useState(null);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!dbInstance || !appId || !isAuthReady) return;

        const postsQuery = query(collection(dbInstance, `artifacts/${appId}/public/data/posts`), orderBy('postedAt', 'desc'));
        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        }, (error) => console.error("Error fetching posts:", error.code, error.message));

        if (user) {
            getUserProfile(dbInstance, user.uid, appId).then(setMyProfile);
        }
        return () => unsubscribe();
    }, [dbInstance, appId, isAuthReady, user]);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!dbInstance || !appId || !user || !myProfile) {
            setMessage('You must be logged in to post.');
            return;
        }
        try {
            await addDoc(collection(dbInstance, `artifacts/${appId}/public/data/posts`), {
                title: newPostTitle,
                content: newPostContent,
                postedBy: myProfile.name,
                postedById: user.uid,
                postedAt: serverTimestamp(),
                likes: 0,
                comments: [],
            });
            setMessage('Post shared successfully!');
            setIsPostModalOpen(false);
            setNewPostTitle('');
            setNewPostContent('');
        } catch (error) {
            console.error("Error posting:", error);
            setMessage('Failed to share post. Please try again.');
        }
    };

    const PostModal = () => (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-lg mx-4">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create a New Post</h3>
                    <button onClick={() => setIsPostModalOpen(false)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handlePost} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Post Title</label>
                        <input
                            type="text"
                            value={newPostTitle}
                            onChange={(e) => setNewPostTitle(e.target.value)}
                            className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Content</label>
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            className="w-full p-3 rounded-lg border h-32 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                        Share Post
                    </button>
                </form>
            </div>
        </div>
    );

    const filteredPosts = posts.filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.content.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Posts</h2>
                {myProfile && (
                    <button onClick={() => setIsPostModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <PlusCircle size={18} /> <span>Create Post</span>
                    </button>
                )}
            </div>
            {message && (
                <div className="p-4 rounded-xl bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">
                    {message}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                        <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col transition-all hover:shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{post.title}</h3>
                            <p className="mt-2 flex-1 text-gray-600 dark:text-gray-400">{post.content}</p>
                            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">Posted by: {post.postedBy}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-600">Posted on: {post.postedAt?.toDate().toLocaleDateString()}</p>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-500 dark:text-gray-400 italic text-lg">No posts to display.</div>
                )}
            </div>
            {isPostModalOpen && <PostModal />}
        </div>
    );
};

const ConnectionsPage = ({ onViewProfile }) => {
    const { dbInstance, appId, user } = useAppContext();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchConnections = async () => {
            setLoading(true);
            try {
                const connectionsDocRef = doc(dbInstance, `artifacts/${appId}/public/data/connections`, user.uid);
                const docSnap = await getDoc(connectionsDocRef);

                if (docSnap.exists()) {
                    const connectionIds = docSnap.data().connectedTo || [];
                    const profilePromises = connectionIds.map(id => getUserProfile(dbInstance, id, appId));
                    const connectionProfiles = await Promise.all(profilePromises);
                    setConnections(connectionProfiles.filter(Boolean)); // Filter out null profiles
                }
            } catch (error) {
                console.error("Error fetching connections:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConnections();
    }, [dbInstance, appId, user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Connections</h2>
            {connections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {connections.map(profile => (
                        <div key={profile.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center transition-all hover:shadow-2xl hover:scale-105">
                            <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                {profile.profilePictureUrl ? (
                                    <img src={profile.profilePictureUrl} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-gray-500" />
                                )}
                            </div>
                            <h4 className="text-xl font-bold mt-4 text-gray-900 dark:text-gray-100">{profile.name}</h4>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{profile.headline || profile.role}</p>
                            <button onClick={() => onViewProfile(profile.id)} className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 italic">You haven't made any connections yet. Go to the Alumni Directory to connect with others.</p>
            )}
        </div>
    );
};

const ViewProfilePage = ({ profileId, onNavigate }) => {
    const { dbInstance, appId } = useAppContext();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profileId) return;
        const fetchProfile = async () => {
            setLoading(true);
            const profile = await getUserProfile(dbInstance, profileId, appId);
            setProfileData(profile);
            setLoading(false);
        };
        fetchProfile();
    }, [profileId, dbInstance, appId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (!profileData) {
        return <div className="text-center p-8">Profile not found.</div>;
    }

    return (
        <div className="p-4 space-y-8">
             <button onClick={() => onNavigate('connections')} className="flex items-center text-blue-500 hover:underline mb-4">
                <ArrowLeft size={20} className="mr-1" />
                Back to Connections
            </button>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
                <ProfileHeadline {...profileData} />
                <hr className="border-gray-200 dark:border-gray-700" />
                <ExperienceSection experience={profileData?.experience || []} />
                <hr className="border-gray-200 dark:border-gray-700" />
                <EducationSection education={profileData?.education || []} />
                <hr className="border-gray-200 dark:border-gray-700" />
                <SkillsSection skills={profileData?.skills} />
            </div>
        </div>
    );
};

const NewChatModal = ({ isOpen, onClose, onSelectUser }) => {
    const { dbInstance, appId, user } = useAppContext();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchConnections = async () => {
            setLoading(true);
            const connectionsDocRef = doc(dbInstance, `artifacts/${appId}/public/data/connections`, user.uid);
            const connectionsSnap = await getDoc(connectionsDocRef);

            if (connectionsSnap.exists()) {
                const connectionIds = connectionsSnap.data().connectedTo || [];
                const profiles = await Promise.all(
                    connectionIds.map(id => getUserProfile(dbInstance, id, appId))
                );
                setConnections(profiles.filter(Boolean)); // Filter out any null profiles
            }
            setLoading(false);
        };

        fetchConnections();
    }, [isOpen, user, dbInstance, appId]);

    if (!isOpen) return null;

    const filteredConnections = connections.filter(conn =>
        conn.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Message</h3>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700">
                        <X size={24} />
                    </button>
                </div>
                <div className="relative mb-4">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search your connections..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 rounded-full border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : filteredConnections.length > 0 ? (
                        filteredConnections.map(conn => (
                            <div key={conn.id} onClick={() => onSelectUser(conn.id)} className="flex items-center p-3 space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {conn.profilePictureUrl ? (
                                        <img src={conn.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} className="text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{conn.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{conn.headline || conn.role}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 italic py-8">No connections found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const Messenger = () => {
    const { dbInstance, appId, user, isAuthReady } = useAppContext();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const chatEndRef = useRef(null);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        // Timestamps from the array will be objects from Firestore, they need .toDate()
        return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    useEffect(() => {
        if (!dbInstance || !user || !isAuthReady) return;
        const q = query(collection(dbInstance, `artifacts/${appId}/public/data/messages`), where('participants', 'array-contains', user.uid), orderBy('lastUpdated', 'desc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const conversationsData = await Promise.all(snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const otherUserId = data.participants.find(id => id !== user.uid);
                const otherUserProfile = await getUserProfile(dbInstance, otherUserId, appId);
                return { id: doc.id, ...data, otherUser: otherUserProfile };
            }));
            setConversations(conversationsData);
        });
        return () => unsubscribe();
    }, [dbInstance, appId, user, isAuthReady]);

    useEffect(() => {
        if (activeChat?.id) {
            const chatDocRef = doc(dbInstance, `artifacts/${appId}/public/data/messages`, activeChat.id);
            const unsubscribe = onSnapshot(chatDocRef, (doc) => {
                if (doc.exists()) {
                    setActiveChat(prev => ({ ...prev, ...doc.data() }));
                }
            });
            return () => unsubscribe();
        }
    }, [activeChat?.id, dbInstance, appId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat?.messages]);

    // const handleSendMessage = async () => {
    //     if (newMessage.trim() === '' || !activeChat) return;

    //     /**
    //      * FINAL FIX: Use a client-side timestamp (new Date()) for messages inside an array.
    //      * Firestore does not support serverTimestamp() within array operations.
    //      * This resolves the error you were seeing.
    //      */
    //     const messagePayload = {
    //         senderId: user.uid,
    //         text: newMessage,
    //         timestamp: new Date(), // Use client timestamp here
    //     };

    //     const chatDocRef = doc(dbInstance, `artifacts/${appId}/public/data/messages`, activeChat.id);
        
    //     await updateDoc(chatDocRef, {
    //         messages: arrayUnion(messagePayload),
    //         lastUpdated: serverTimestamp() // serverTimestamp is fine here on a top-level field
    //     });

    //     setNewMessage('');
    // };

const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !activeChat) return;

    /**
     * EXPLANATION: Firestore does not support serverTimestamp() inside an arrayUnion operation.
     * To solve this, we use a client-side timestamp (new Date()) for the message object itself.
     * This ensures the message gets a timestamp without causing an error.
     * We can still use serverTimestamp() to update a top-level field like 'lastUpdated'.
     */
    const messagePayload = {
        senderId: user.uid,
        text: newMessage,
        timestamp: new Date(), // Use client timestamp here
    };

    const chatDocRef = doc(dbInstance, `artifacts/${appId}/public/data/messages`, activeChat.id);

    await updateDoc(chatDocRef, {
        messages: arrayUnion(messagePayload),
        lastUpdated: serverTimestamp() // serverTimestamp is fine on a top-level field
    });

    setNewMessage('');
};

    const handleStartNewChat = async (otherUserId) => {
        setIsNewChatModalOpen(false);
        if (!user || !dbInstance) return;
        const chatId = await findOrCreateChat(dbInstance, appId, user.uid, otherUserId);
        const chatDoc = await getDoc(doc(dbInstance, `artifacts/${appId}/public/data/messages`, chatId));
        const otherUser = await getUserProfile(dbInstance, otherUserId, appId);
        if (chatDoc.exists()) {
            const newActiveChat = { id: chatDoc.id, ...chatDoc.data(), otherUser };
            handleSelectConversation(newActiveChat);
        }
    };

    const handleSelectConversation = async (conv) => {
        setActiveChat(conv);
        const chatDocRef = doc(dbInstance, `artifacts/${appId}/public/data/messages`, conv.id);
        await updateDoc(chatDocRef, {
            [`lastRead.${user.uid}`]: serverTimestamp()
        });
    };

    return (
        <div className="flex w-full min-h-[calc(100vh-160px)] p-0">
            {/* Conversation List (Left Panel) */}
            <div className={`w-full md:w-1/3 h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700 md:rounded-l-xl md:shadow-lg flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Conversations</h3>
                    <button onClick={() => setIsNewChatModalOpen(true)} className="p-2 rounded-full text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                        <PlusCircle size={24} />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1">
                    {conversations.map(conv => {
                        const lastReadTime = conv.lastRead?.[user.uid]?.toMillis();
                        const lastUpdatedTime = conv.lastUpdated?.toMillis();
                        const isUnread = lastUpdatedTime && (!lastReadTime || lastUpdatedTime > lastReadTime);
                        return (
                            <div
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv)}
                                className={`p-3 flex items-center space-x-3 cursor-pointer transition-colors border-b dark:border-gray-700 ${activeChat?.id === conv.id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                        {conv.otherUser?.profilePictureUrl ? (
                                            <img src={conv.otherUser.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={24} className="text-gray-500" />
                                        )}
                                    </div>
                                    {isUnread && (
                                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-800" />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{conv.otherUser?.name || 'Unknown User'}</p>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatTimestamp(conv.lastUpdated)}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{conv.messages?.[conv.messages.length - 1]?.text || 'No messages yet'}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Active Chat Window (Right Panel) */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-gray-800 md:rounded-r-xl md:shadow-lg ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                {activeChat ? (
                    <>
                        <div className="flex items-center p-4 border-b dark:border-gray-700">
                            <button onClick={() => setActiveChat(null)} className="md:hidden p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full mr-2">
                                <ArrowLeft size={20} />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {activeChat.otherUser?.profilePictureUrl ? (
                                    <img src={activeChat.otherUser.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-gray-500" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 ml-3">{activeChat.otherUser?.name || 'Chat'}</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 p-4">
                            {activeChat.messages?.map((msg, index) => (
                                <div key={index} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${msg.senderId === user.uid ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'}`}>
                                        <p>{msg.text}</p>
                                        <span className="block text-xs text-right opacity-60 mt-1">{formatTimestamp(msg.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-4 border-t dark:border-gray-700">
                            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-full p-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Message..."
                                    className="flex-1 bg-transparent p-2 rounded-full text-gray-900 dark:text-gray-100 focus:outline-none"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                     <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 italic">
                        Select a conversation or start a new one.
                    </div>
                )}
            </div>
            
            <NewChatModal
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                onSelectUser={handleStartNewChat}
            />
        </div>
    );
};
// const MessengerSidebar = () => {
//     const { dbInstance, appId, user, isAuthReady } = useAppContext();
//     const [conversations, setConversations] = useState([]);
//     const [activeChat, setActiveChat] = useState(null);
//     const [newMessage, setNewMessage] = useState('');
//     const [isCollapsed, setIsCollapsed] = useState(true); // Chat starts collapsed
//     const chatEndRef = useRef(null);

//     // This logic is the same as the old Messenger component
//     useEffect(() => {
//         if (!isAuthReady || !user || !dbInstance) return;

//         const q = query(collection(dbInstance, `artifacts/${appId}/public/data/messages`), where('participants', 'array-contains', user.uid), orderBy('lastUpdated', 'desc'));
//         const unsubscribe = onSnapshot(q, async (snapshot) => {
//             const conversationsData = await Promise.all(snapshot.docs.map(async (doc) => {
//                 const data = doc.data();
//                 const otherUserId = data.participants.find(id => id !== user.uid);
//                 const otherUserProfile = await getUserProfile(dbInstance, otherUserId, appId);
//                 return { id: doc.id, ...data, otherUser: otherUserProfile };
//             }));
//             setConversations(conversationsData);
//         });
//         return () => unsubscribe();
//     }, [dbInstance, appId, user, isAuthReady]);
    
//     useEffect(() => {
//         chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [activeChat?.messages]);
    
//     const formatTimestamp = (timestamp) => {
//         if (!timestamp) return '';
//         return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     }

//     const handleSelectConversation = async (conv) => {
//         setActiveChat(conv);
//         if (isCollapsed) {
//             setIsCollapsed(false); // Open the window if it's collapsed
//         }
//         const chatDocRef = doc(dbInstance, `artifacts/${appId}/public/data/messages`, conv.id);
//         await updateDoc(chatDocRef, { [`lastRead.${user.uid}`]: serverTimestamp() });
//     };

//     const handleSendMessage = async () => {
//         if (newMessage.trim() === '' || !activeChat) return;
//         const messagePayload = { senderId: user.uid, text: newMessage, timestamp: new Date() };
//         const chatDocRef = doc(dbInstance, `artifacts/${appId}/public/data/messages`, activeChat.id);
//         await updateDoc(chatDocRef, {
//             messages: arrayUnion(messagePayload),
//             lastUpdated: serverTimestamp()
//         });
//         setNewMessage('');
//     };
    
//     // Don't render anything if the user is not logged in
//     if (!user) return null;

//     return (
//         <div className="fixed bottom-0 right-4 z-40 w-80">
//             <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-2xl border-l border-r border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out" style={{ height: isCollapsed ? '48px' : '500px' }}>
//                 <div onClick={() => setIsCollapsed(!isCollapsed)} className="flex justify-between items-center p-3 cursor-pointer bg-blue-600 text-white rounded-t-xl h-12">
//                     <h3 className="font-bold">Messenger</h3>
//                     <span className="text-xl transform transition-transform">{isCollapsed ? '↑' : '↓'}</span>
//                 </div>
                
//                 {!isCollapsed && (
//                     <div className="h-[calc(500px-48px)] flex flex-col bg-white dark:bg-gray-800">
//                         {!activeChat ? (
//                             <div className="overflow-y-auto flex-1">
//                                 {conversations.length === 0 && <p className="text-center text-gray-500 p-4 italic">No conversations yet.</p>}
//                                 {conversations.map(conv => {
//                                     const lastReadTime = conv.lastRead?.[user.uid]?.toMillis();
//                                     const lastUpdatedTime = conv.lastUpdated?.toMillis();
//                                     const isUnread = lastUpdatedTime && (!lastReadTime || lastUpdatedTime > lastReadTime);
//                                     return (
//                                         <div key={conv.id} onClick={() => handleSelectConversation(conv)} className="p-2 flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700">
//                                             <div className="relative">
//                                                 <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
//                                                     {conv.otherUser?.profilePictureUrl ? (<img src={conv.otherUser.profilePictureUrl} alt="p" className="w-full h-full object-cover" />) : (<User size={20} />)}
//                                                 </div>
//                                                 {isUnread && (<span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />)}
//                                             </div>
//                                             <div className="flex-1 overflow-hidden">
//                                                 <p className="font-semibold text-sm truncate">{conv.otherUser?.name || 'Unknown'}</p>
//                                                 <p className="text-xs text-gray-500 truncate">{conv.messages?.[conv.messages.length - 1]?.text || ''}</p>
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         ) : (
//                             <div className="flex-1 flex flex-col h-full">
//                                 <div className="flex items-center p-2 border-b dark:border-gray-700 space-x-2">
//                                     <button onClick={() => setActiveChat(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeft size={20} /></button>
//                                     <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
//                                         {activeChat.otherUser?.profilePictureUrl ? (<img src={activeChat.otherUser.profilePictureUrl} alt="p" className="w-full h-full object-cover" />) : (<User size={18} />)}
//                                     </div>
//                                     <h4 className="font-bold text-sm flex-1 truncate">{activeChat.otherUser?.name || 'Chat'}</h4>
//                                 </div>
//                                 <div className="flex-1 overflow-y-auto p-2 space-y-3">
//                                     {activeChat.messages?.map((msg, index) => (
//                                         <div key={index} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
//                                             <div className={`max-w-[75%] p-2 rounded-lg text-sm ${msg.senderId === user.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
//                                                 <p>{msg.text}</p>
//                                             </div>
//                                         </div>
//                                     ))}
//                                     <div ref={chatEndRef} />
//                                 </div>
//                                 <div className="p-2 border-t dark:border-gray-700 flex items-center space-x-2">
//                                     <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type..." className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-full focus:outline-none" />
//                                     <button onClick={handleSendMessage} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"><Send size={18} /></button>
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

const MessengerSidebar = () => {
    const { dbInstance, appId, user, isAuthReady } = useAppContext();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false); // State for the modal
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (!isAuthReady || !user || !dbInstance) return;
        const q = query(collection(dbInstance, `artifacts/${appId}/public/data/messages`), where('participants', 'array-contains', user.uid), orderBy('lastUpdated', 'desc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const conversationsData = await Promise.all(snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const otherUserId = data.participants.find(id => id !== user.uid);
                const otherUserProfile = await getUserProfile(dbInstance, otherUserId, appId);
                return { id: doc.id, ...data, otherUser: otherUserProfile };
            }));
            setConversations(conversationsData);
        });
        return () => unsubscribe();
    }, [dbInstance, appId, user, isAuthReady]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat?.messages]);
    
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const handleSelectConversation = async (conv) => {
        setActiveChat(conv);
        if (isCollapsed) setIsCollapsed(false);
        const chatDocRef = doc(dbInstance, `artifacts/${appId}/public/data/messages`, conv.id);
        await updateDoc(chatDocRef, { [`lastRead.${user.uid}`]: serverTimestamp() });
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || !activeChat) return;
        const messagePayload = { senderId: user.uid, text: newMessage, timestamp: new Date() };
        const chatDocRef = doc(dbInstance, `artifacts/${appId}/public/data/messages`, activeChat.id);
        await updateDoc(chatDocRef, {
            messages: arrayUnion(messagePayload),
            lastUpdated: serverTimestamp()
        });
        setNewMessage('');
    };

    /**
     * This function now lives inside the sidebar to handle starting new chats.
     */
    const handleStartNewChat = async (otherUserId) => {
        setIsNewChatModalOpen(false); // Close the pop-up
        if (!user || !dbInstance) return;

        const chatId = await findOrCreateChat(dbInstance, appId, user.uid, otherUserId);
        const chatDoc = await getDoc(doc(dbInstance, `artifacts/${appId}/public/data/messages`, chatId));
        const otherUser = await getUserProfile(dbInstance, otherUserId, appId);
        if (chatDoc.exists()) {
            const newActiveChat = { id: chatDoc.id, ...chatDoc.data(), otherUser };
            handleSelectConversation(newActiveChat); // Open the new chat
        }
    };
    
    if (!user) return null;

    return (
        // Use a React Fragment to render the sidebar and the modal side-by-side
        <>
            <div className="fixed bottom-0 right-4 z-40 w-80">
                <div className="bg-white dark:bg-gray-800 rounded-t-xl shadow-2xl border-l border-r border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out" style={{ height: isCollapsed ? '48px' : '500px' }}>
                    <div onClick={() => setIsCollapsed(!isCollapsed)} className="flex justify-between items-center p-3 cursor-pointer bg-blue-600 text-white rounded-t-xl h-12">
                        <h3 className="font-bold">Messenger</h3>
                        <span className="text-xl transform transition-transform">{isCollapsed ? '↑' : '↓'}</span>
                    </div>
                    
                    {!isCollapsed && (
                        <div className="h-[calc(500px-48px)] flex flex-col bg-white dark:bg-gray-800">
                            {!activeChat ? (
                                <>
                                    {/* --- FIX: Header with "Start New Chat" button --- */}
                                    <div className="p-2 flex justify-between items-center border-b dark:border-gray-700">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 ml-2">Conversations</h4>
                                        <button onClick={() => setIsNewChatModalOpen(true)} className="p-2 rounded-full text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-700" title="Start a new chat">
                                            <PlusCircle size={20} />
                                        </button>
                                    </div>

                                    <div className="overflow-y-auto flex-1">
                                        {conversations.length === 0 && <p className="text-center text-gray-500 p-4 italic">No conversations yet. Click '+' to start a chat.</p>}
                                        {conversations.map(conv => {
                                            const lastReadTime = conv.lastRead?.[user.uid]?.toMillis();
                                            const lastUpdatedTime = conv.lastUpdated?.toMillis();
                                            const isUnread = lastUpdatedTime && (!lastReadTime || lastUpdatedTime > lastReadTime);
                                            return (
                                                <div key={conv.id} onClick={() => handleSelectConversation(conv)} className="p-2 flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                            {conv.otherUser?.profilePictureUrl ? (<img src={conv.otherUser.profilePictureUrl} alt="p" className="w-full h-full object-cover" />) : (<User size={20} />)}
                                                        </div>
                                                        {isUnread && (<span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />)}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="font-semibold text-sm truncate">{conv.otherUser?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500 truncate">{conv.messages?.[conv.messages.length - 1]?.text || ''}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col h-full">
                                    <div className="flex items-center p-2 border-b dark:border-gray-700 space-x-2">
                                        <button onClick={() => setActiveChat(null)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeft size={20} /></button>
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                            {activeChat.otherUser?.profilePictureUrl ? (<img src={activeChat.otherUser.profilePictureUrl} alt="p" className="w-full h-full object-cover" />) : (<User size={18} />)}
                                        </div>
                                        <h4 className="font-bold text-sm flex-1 truncate">{activeChat.otherUser?.name || 'Chat'}</h4>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-3">
                                        {activeChat.messages?.map((msg, index) => (
                                            <div key={index} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] p-2 rounded-lg text-sm ${msg.senderId === user.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                                    <p>{msg.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="p-2 border-t dark:border-gray-700 flex items-center space-x-2">
                                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type..." className="flex-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-full focus:outline-none" />
                                        <button onClick={handleSendMessage} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"><Send size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Render the NewChatModal, controlled by the sidebar's state */}
            <NewChatModal
                isOpen={isNewChatModalOpen}
                onClose={() => setIsNewChatModalOpen(false)}
                onSelectUser={handleStartNewChat}
            />
        </>
    );
};
const Profile = ({ onNavigate }) => {
    const { dbInstance, appId, user, isAuthReady } = useAppContext();
    const [profileData, setProfileData] = useState(null);
    const [connections, setConnections] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!dbInstance || !user || !appId || !isAuthReady) return;

        const fetchProfile = async () => {
            const profile = await getUserProfile(dbInstance, user.uid, appId);
            setProfileData(profile);
            setFormData(profile || {
                name: '',
                email: user.email,
                role: 'student',
                headline: '',
                currentJob: '',
                company: '',
                graduationYear: '',
                skills: [],
                branch: '',
                resumeUrl: '',
                profilePictureUrl: '',
                experience: [],
                education: []
            });
        };
        fetchProfile();

        const connectionsDocRef = doc(dbInstance, `artifacts/${appId}/public/data/connections`, user.uid);
        const unsubscribeConnections = onSnapshot(connectionsDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setConnections(docSnap.data().connectedTo || []);
            } else {
                setConnections([]);
            }
        }, (error) => console.error("Error fetching connections:", error.code, error.message));
        return () => unsubscribeConnections();

    }, [dbInstance, user, appId, isAuthReady]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillsChange = (e) => {
        const skills = e.target.value.split(',').map(s => s.trim());
        setFormData(prev => ({ ...prev, skills }));
    };

    const handleExperienceChange = (index, field, value) => {
        const newExperience = [...(formData.experience || [])];
        newExperience[index] = { ...newExperience[index], [field]: value };
        setFormData(prev => ({ ...prev, experience: newExperience }));
    };

    const addExperience = () => {
        setFormData(prev => ({
            ...prev,
            experience: [...(prev.experience || []), { role: '', company: '', startDate: '', endDate: '', description: '' }]
        }));
    };

    const removeExperience = (index) => {
        const newExperience = [...formData.experience];
        newExperience.splice(index, 1);
        setFormData(prev => ({ ...prev, experience: newExperience }));
    };

    const handleEducationChange = (index, field, value) => {
        const newEducation = [...(formData.education || [])];
        newEducation[index] = { ...newEducation[index], [field]: value };
        setFormData(prev => ({ ...prev, education: newEducation }));
    };

    const addEducation = () => {
        setFormData(prev => ({
            ...prev,
            education: [...(prev.education || []), { degree: '', institution: '', year: '' }]
        }));
    };

    const removeEducation = (index) => {
        const newEducation = [...formData.education];
        newEducation.splice(index, 1);
        setFormData(prev => ({ ...prev, education: newEducation }));
    };

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const simulatedUrl = `https://my-storage.com/${user.uid}/resume-${file.name}`;
            setFormData(prev => ({ ...prev, resumeUrl: simulatedUrl }));
        }
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormData(prev => ({ ...prev, profilePictureUrl: e.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!profileData) {
                await createUserProfile(dbInstance, user.uid, appId, formData);
                setMessage('Profile created successfully!');
            } else {
                await updateProfile(dbInstance, user.uid, appId, formData);
                setMessage('Profile updated successfully!');
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving profile:", error);
            setMessage('Failed to save profile. Please try again.');
        }
    };

    if (!isAuthReady || !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 text-center">
                <Loader2 className="animate-spin mr-2" size={32} />
                <span className="text-xl text-gray-600 dark:text-gray-400">Loading user data...</span>
            </div>
        );
    }

    if (!profileData && !isEditing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Create Your Profile</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">It looks like you don't have a profile yet. Let's create one!</p>
                <button
                    onClick={() => setIsEditing(true)}
                    className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                >
                    Create Profile
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-8">
            {message && (
                <div className="p-4 rounded-xl bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">
                    {message}
                </div>
            )}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Profile</h2>
                {!isEditing && profileData && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <Edit size={18} />
                        <span>Edit Profile</span>
                    </button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Basic Info</h3>
                    <div className="flex items-center space-x-4">
                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {formData.profilePictureUrl ? (
                                <img src={formData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-gray-500" />
                            )}
                        </div>
                        <label className="flex-1">
                            <span className="block text-gray-700 dark:text-gray-300 mb-1">Profile Picture</span>
                            <input type="file" onChange={handleProfilePictureChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </label>
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Headline</label>
                        <input type="text" name="headline" value={formData.headline} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="e.g., Software Engineer at Google | Lifelong Learner" />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                            <option value="student">Student</option>
                            <option value="alumni">Alumni</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Current Job</label>
                        <input type="text" name="currentJob" value={formData.currentJob} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Company</label>
                        <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Graduation Year</label>
                        <input type="number" name="graduationYear" value={formData.graduationYear} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    </div>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                        <input type="text" name="branch" value={formData.branch} onChange={handleChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    </div>
                    {formData.role === 'student' && (
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-1">Resume</label>
                            <input type="file" onChange={handleResumeChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                            {formData.resumeUrl && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Current Resume: <a href={formData.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Resume</a>
                                </p>
                            )}
                        </div>
                    )}

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Experience</h3>
                    {formData.experience?.map((exp, index) => (
                        <div key={index} className="space-y-2 border p-4 rounded-lg dark:border-gray-700">
                            <div className="flex justify-end">
                                <button type="button" onClick={() => removeExperience(index)} className="text-red-500 hover:text-red-700">
                                    <X size={16} />
                                </button>
                            </div>
                            <input type="text" value={exp.role} onChange={(e) => handleExperienceChange(index, 'role', e.target.value)} placeholder="Role" className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                            <input type="text" value={exp.company} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)} placeholder="Company" className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                            <input type="text" value={exp.startDate} onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)} placeholder="Start Date" className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                            <input type="text" value={exp.endDate} onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)} placeholder="End Date (or 'Present')" className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                    ))}
                    <button type="button" onClick={addExperience} className="w-full text-blue-500 font-semibold border-2 border-dashed border-blue-300 rounded-lg p-3 hover:bg-blue-50 transition-colors">Add Experience</button>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Education</h3>
                    {formData.education?.map((edu, index) => (
                        <div key={index} className="space-y-2 border p-4 rounded-lg dark:border-gray-700">
                            <div className="flex justify-end">
                                <button type="button" onClick={() => removeEducation(index)} className="text-red-500 hover:text-red-700">
                                    <X size={16} />
                                </button>
                            </div>
                            <input type="text" value={edu.degree} onChange={(e) => handleEducationChange(index, 'degree', e.target.value)} placeholder="Degree" className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                            <input type="text" value={edu.institution} onChange={(e) => handleEducationChange(index, 'institution', e.target.value)} placeholder="Institution" className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                            <input type="text" value={edu.year} onChange={(e) => handleEducationChange(index, 'year', e.target.value)} placeholder="Year of Graduation" className="w-full p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                        </div>
                    ))}
                    <button type="button" onClick={addEducation} className="w-full text-blue-500 font-semibold border-2 border-dashed border-blue-300 rounded-lg p-3 hover:bg-blue-50 transition-colors">Add Education</button>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Skills</h3>
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-1">Skills (comma-separated)</label>
                        <input type="text" name="skills" value={formData.skills?.join(', ')} onChange={handleSkillsChange} className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    </div>

                    <div className="flex space-x-4">
                        <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-colors">
                            Save Profile
                        </button>
                        <button type="button" onClick={() => { setIsEditing(false); setMessage(''); }} className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 font-semibold rounded-full shadow-lg hover:bg-gray-400 transition-colors">
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => setIsEditing(true)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                            <Edit size={20} />
                        </button>
                    </div>
                    <ProfileHeadline {...profileData} />
                    {profileData?.resumeUrl && profileData.role === 'student' && (
                        <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Link size={20} className="text-blue-500" />
                            <a href={profileData.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                View Resume
                            </a>
                        </div>
                    )}
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <ExperienceSection experience={profileData?.experience || []} />
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <EducationSection education={profileData?.education || []} />
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <SkillsSection skills={profileData?.skills} />
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <ConnectionsSection connections={connections} />
                </div>
            )}
        </div>
    );
};



const MainContent = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageContext, setPageContext] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const { user, dbInstance, isAuthReady, appId } = useAppContext();

    useEffect(() => {
        if (user && dbInstance && isAuthReady) {
            getUserProfile(dbInstance, user.uid, appId).then(profile => {
                setUserRole(profile?.role);
            });
        } else {
            setUserRole(null);
        }
    }, [user, dbInstance, isAuthReady, appId]);
    const handleNavigate = (page, context = null) => {
    setCurrentPage(page);
    setPageContext(context);
};
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setCurrentPage('home');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    const handleSignIn = async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const handleSignUp = async (email, password, role, formData) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        if (newUser) {
            const profileData = role === 'student' ? {
                name: formData.name, email: newUser.email, role: role, headline: '', currentJob: '',
                company: '', graduationYear: formData.graduationYear, skills: formData.skills,
                branch: formData.branch, isVerified: false, resumeUrl: '', experience: [], education: []
            } : {
                name: '', email: newUser.email, role: role, headline: '', currentJob: '', company: '',
                graduationYear: '', skills: [], branch: '', isVerified: false, resumeUrl: '',
                experience: [], education: []
            };
            await createUserProfile(db, newUser.uid, appId, profileData);
        }
    };
    
    // This is the "router" that decides which main page to show.
    const renderPage = () => {
        if (!isAuthReady) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 text-center">
                    <Loader2 className="animate-spin mr-2" size={32} />
                    <span className="text-xl text-gray-600 dark:text-gray-400">Connecting to services...</span>
                </div>
            );
        }
        if (!user && !['home', 'alumni'].includes(currentPage)) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Please Log In</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">You need to be authenticated to access this page.</p>
                </div>
            );
        }

        switch (currentPage) {
    case 'home':
        return <HomePage onNavigate={handleNavigate} />;
    case 'alumni':
        return <AlumniDirectory searchTerm={searchTerm} />;
    case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} searchTerm={searchTerm} />;
    case 'profile':
        return <Profile onNavigate={handleNavigate} />;
    case 'messenger':
        return <Messenger />;
    case 'connections':
        return <ConnectionsPage onViewProfile={(id) => handleNavigate('viewProfile', id)} />;
    case 'viewProfile':
        return <ViewProfilePage profileId={pageContext} onNavigate={handleNavigate} />;
    default:
        return <HomePage onNavigate={handleNavigate} />;
}
    };

    return (
        <div className="font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300">
            <Header
                onNavigate={handleNavigate}
                onSignOut={handleSignOut}
                onSignIn={handleSignIn}
                onSignUp={handleSignUp}
                currentPage={currentPage}
                onContributionClick={() => setIsContributionModalOpen(true)}
                onSearch={setSearchTerm}
                userRole={userRole}
            />
            <main className="container mx-auto p-4 flex-1">
                {renderPage()}
            </main>
            
            {/* The new MessengerSidebar is now rendered here permanently */}
            <MessengerSidebar />

            <button
                onClick={() => setIsChatbotOpen(!isChatbotOpen)}
                className="fixed bottom-4 left-4 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
                aria-label="Open Chatbot"
            >
                {isChatbotOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
            <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
            <ContributionModal isOpen={isContributionModalOpen} onClose={() => setIsContributionModalOpen(false)} />
            <footer className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-8 mt-12">
                <div className="container mx-auto text-center space-y-4">
                    <p className="font-semibold text-lg">Contact Admin</p>
                    <div className="flex justify-center space-x-4">
                        <a href="mailto:admin@alumniconnect.com" className="hover:text-blue-500 transition-colors flex items-center">
                            <Mail size={20} className="mr-1" /> admin@alumniconnect.com
                        </a>
                        <a href="tel:+1234567890" className="hover:text-blue-500 transition-colors flex items-center">
                            <Phone size={20} className="mr-1" /> +1 (234) 567-890
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};




export default function App() {
    return (
        <AppProvider>
            <MainContent />
        </AppProvider>
    );
}