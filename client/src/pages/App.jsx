import React from 'react';
import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Signup from './Signup'
import Login from './Login';

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login></Login>}></Route>
          <Route path='/signup' element={<Signup/>}></Route>
        </Routes>
      </BrowserRouter>

    </div>
  )
}

export default App;
