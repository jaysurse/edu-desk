const Footer = () => {
  return (
    <footer className="bg-gray-900 text-center py-6 text-sm text-gray-300">
      <p className="mb-2">&copy; 2025 Edu-Desk. All rights reserved.</p>
      <p className="mb-2">
        Developed with <span className="text-red-500">❤️</span> by{" "}
        <strong className="text-white">Jay Surse</strong> (Frontend) &{" "}
        <strong className="text-white">Aditi Sonawane</strong> (Backend)
      </p>
      <p className="text-gray-400">
        Contact:{" "}
        <a
          href="mailto:jaysurse07@gmail.com"
          className="text-blue-400 hover:underline"
        >
          jaysurse07@gmail.com
        </a>{" "}
        |{" "}
        <a
          href="mailto:sonawanetanvi11@gmail.com"
          className="text-blue-400 hover:underline"
        >
          sonawanetanvi11@gmail.com
        </a>
      </p>
    </footer>
  );
};

export default Footer;
