import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script src="https://unpkg.com/xlsx/dist/xlsx.full.min.js"></script>
      </head>
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
} 