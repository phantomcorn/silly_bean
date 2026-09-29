import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { BeanPage } from "./pages/BeanPage";
import { FarmPage } from "./pages/FarmPage";
import { BeanStalkPage } from "./pages/BeanStalkPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="bean" element={<BeanPage />} />
          <Route path="farm" element={<FarmPage />} />
          <Route path="beanstalk" element={<BeanStalkPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
