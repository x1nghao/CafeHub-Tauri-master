import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from 'react-router'
import router from "@/router";
import '@/App.css'
import '@ant-design/v5-patch-for-react-19';

// remember the naming convention camelcase, it always started with variable in lowercase, next word with capital
// app.tsx deprecated, bcs of the main is not currently being used as the main container for all the apps
// it is said that the convention of making router like this is more convenient than the one we used to make
// that is to use the browser router

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
