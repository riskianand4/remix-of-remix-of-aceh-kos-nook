import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Layout } from '@/components/layout/layout';
import Dashboard from '@/pages/Dashboard';
import Analysis from '@/pages/Analysis';
import Dataset from '@/pages/Dataset';
import Evaluation from '@/pages/Evaluation';
import About from '@/pages/About';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="analisis" element={<Analysis />} />
            <Route path="dataset" element={<Dataset />} />
            <Route path="evaluasi" element={<Evaluation />} />
            <Route path="tentang" element={<About />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
