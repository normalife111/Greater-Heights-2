import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Contact from './pages/Contact';
import Events from './pages/Events';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import Menu from './pages/Menu';
import NotFound from './pages/NotFound';
import Reservations from './pages/Reservations';
import Story from './pages/Story';
import './styles/tokens.css';
import './styles/global.css';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/our-story', element: <Story /> },
      { path: '/menu', element: <Menu /> },
      { path: '/reservations', element: <Reservations /> },
      { path: '/gallery', element: <Gallery /> },
      { path: '/events', element: <Events /> },
      { path: '/contact', element: <Contact /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
