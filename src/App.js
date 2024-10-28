import React, { useRef, useState } from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { AiOutlineDelete } from "react-icons/ai";


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
      <header>
        {user ? <SignOut /> : null}
      </header>
      <section>
        {user ? <ChatRoom /> : <SignIn />}
      </section>
    </>
  );
}
function ChatRoom() {
  const dummy = useRef();
  const messageRef = collection(firestore, 'messages');
  const messagesQuery = query(messageRef, orderBy('createdAt'), limit(25));
  const [messages] = useCollectionData(messagesQuery, { idField: 'id' });
  const [formValue, setFormValue] = useState('');

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;

    await addDoc(messageRef, {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL
    });

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteMessage = async (id) => {
    if (!id) {
      console.error("Message ID is undefined.");
      return;
    }
    try {
      const messageDoc = doc(firestore, 'messages', id);
      await deleteDoc(messageDoc);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  return (
    <>
      <main>
        {messages && messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} deleteMessage={deleteMessage} />
        ))}
        <div ref={dummy}></div>
      </main>
      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </>
  );
}

function ChatMessage({ message, deleteMessage }) {
  const { text, uid, photoURL, id } = message;
  const messageClass = uid === auth.currentUser.uid ? 'send' : 'received';

  return (
    <div className={`message ${messageClass}`}>
      <img src={photoURL} alt="User Avatar" />
      <p>{text}</p>
      {uid === auth.currentUser.uid && (
        <button onClick={() => deleteMessage(id)}><AiOutlineDelete/></button>
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
      console.error("Google sign-in failed:", error);
      alert("Unable to sign in. Please try a different browser or disable VPN if active.");
    }
  };
  
  return <button onClick={signInWithGoogle}>Sign in with Google</button>;
}

function SignOut() {
  return auth.currentUser && (
    <button onClick={() => signOut(auth)}>Sign Out</button>
  );
}

export default App;
