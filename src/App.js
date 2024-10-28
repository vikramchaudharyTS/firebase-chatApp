// App.js
import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { AiOutlineDelete } from 'react-icons/ai';


const firebaseConfig = {
  apiKey: "AIzaSyBxY_1OuLHkrWsv5HDDC16WrDpcnEtH3WM",
  authDomain: "chat-app-b4290.firebaseapp.com",
  projectId: "chat-app-b4290",
  storageBucket: "chat-app-b4290.appspot.com",
  messagingSenderId: "411486295924",
  appId: "1:411486295924:web:968e4be7a11b038e79fe21"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

function App() {
  const [user] = useAuthState(auth);

  return (
    <>
      <header>{user ? <SignOut /> : null}</header>
      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </>
  );
}

function ChatRoom() {
  const dummy = useRef();
  const messageRef = collection(firestore, 'messages');
  const messagesQuery = query(messageRef, orderBy('createdAt'), limit(25));
  const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState('');

  
// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const messagesData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id, // Explicitly add the id from Firestore document
      }));
      setMessages(messagesData);
    });
    return unsubscribe;
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;

    await addDoc(messageRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteMessage = async (id) => {
    if (!id) {
      console.error('Message ID is undefined.');
      return;
    }
    try {
      const messageDoc = doc(firestore, 'messages', id);
      await deleteDoc(messageDoc);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  return (
    <>
      <main>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} deleteMessage={deleteMessage} />
        ))}
        <div ref={dummy}></div>
      </main>
      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Say something nice"
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
}

function ChatMessage({ message, deleteMessage }) {
  const { text, uid, photoURL, id } = message;
  const messageClass = uid === auth.currentUser.uid ? 'send' : 'received';

  // console.log('Inside ChatMessage, ID:', id); // Debugging to ensure ID is passed

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://placekitten.com/50/50'} alt="User Avatar" />
      <p>{text}</p>
      {uid === auth.currentUser.uid && (
        <button onClick={() => deleteMessage(id)}>
          <AiOutlineDelete />
        </button>
      )}
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      alert('Unable to sign in. Please try again later.');
    }
  };

  return <button onClick={signInWithGoogle}>Sign in with Google</button>;
}

function SignOut() {
  return (
    auth.currentUser && <button onClick={() => signOut(auth)}>Sign Out</button>
  );
}

export default App;
