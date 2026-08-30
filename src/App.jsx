import { useState } from 'react'
import {  Routes, Route, Link } from 'react-router-dom';
import Home from './component/Home';
import './App.css'
import SendWebLink from './component/SendWebLink';
function App() {
  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/form" element={<SendWebLink />} />
    </Routes>
     
    </>
  )
}

export default App
