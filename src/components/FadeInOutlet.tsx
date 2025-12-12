import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';

const FadeInOutlet = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div className={`page-fade ${visible ? 'page-fade-in' : ''}`}>
      <Outlet />
    </div>
  );
};

export default FadeInOutlet;
