import MapComponent from "./components/map/MapComponent";
import { Toaster } from "react-hot-toast";
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter(
  createRoutesFromElements(<Route path="/" element={<MapComponent />} />)
);

const App = () => {
  const toastOptions = { duration: 4000, position: "top-center" };
  return (
    <>
      <RouterProvider router={router} />
      <Toaster toastOptions={toastOptions} />
    </>
  );
};

export default App;
