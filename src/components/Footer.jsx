const Footer = () => {
  return (
    <footer className="bg-gray-900 text-center py-6 text-sm text-gray-400">
      <p className="mb-1">
        &copy; {new Date().getFullYear()} Edu-Desk. All rights reserved.
      </p>
      <p className="text-xs text-gray-500">
        Empowering students through seamless note sharing.
      </p>
    </footer>
  );
};

export default Footer;
