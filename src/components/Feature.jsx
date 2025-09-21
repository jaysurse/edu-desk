import {
  FaFileAlt,
  FaUpload,
  FaShieldAlt,   
  FaFolder,     
  FaSearch,
  FaMoon,
} from "react-icons/fa";

const features = [
  {
    title: "Share Notes",
    icon: <FaFileAlt className="text-blue-600 text-4xl" />,
    description: "Easily share class notes with friends and batchmates.",
  },
  {
    title: "Upload Assignments",
    icon: <FaUpload className="text-purple-600 text-4xl" />,
    description: "Upload your assignments securely for faculty review.",
  },
  {
    title: "Secure Storage",
    icon: <FaShieldAlt className="text-green-600 text-4xl" />,
    description: "Your files are stored safely with reliable cloud storage.",
  },
  {
    title: "Easy Organization",
    icon: <FaFolder className="text-red-500 text-4xl" />,
    description: "Keep your notes and assignments organized in one place.",
  },
  {
    title: "Smart Search",
    icon: <FaSearch className="text-yellow-500 text-4xl" />,
    description: "Find notes quickly by title, subject, or uploader name.",
  },
  {
    title: "Dark Mode",
    icon: <FaMoon className="text-gray-500 text-4xl" />,
    description: "Switch between light and dark themes effortlessly.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-16 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center transition-transform transform hover:scale-105 hover:shadow-2xl hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="mb-4 flex justify-center">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
