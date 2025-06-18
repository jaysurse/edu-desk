import { FaGraduationCap, FaLightbulb, FaBookOpen } from "react-icons/fa";

const About = () => {
  return (
    <section id="about" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-6 text-center" data-aos="fade-up">
        <div className="flex justify-center mb-4 text-blue-600 dark:text-blue-400 text-5xl">
          <FaGraduationCap />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-6">
          About{" "}
          <span className="text-blue-600 dark:text-blue-400">Edu Desk</span>
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          <span className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
            <FaLightbulb /> Edu Desk
          </span>{" "}
          is a collaborative academic platform designed for diploma and degree
          students. It empowers learners to{" "}
          <span className="font-medium text-blue-500 dark:text-blue-300">
            share class notes
          </span>
          ,{" "}
          <span className="font-medium text-blue-500 dark:text-blue-300">
            upload assignments
          </span>
          , and{" "}
          <span className="font-medium text-blue-500 dark:text-blue-300">
            track deadlines
          </span>{" "}
          — all in one place.
        </p>
        <p className="mt-4 text-md text-gray-700 dark:text-gray-400">
          Whether you're a student keeping pace with your syllabus or a faculty
          member streamlining submissions,{" "}
          <span className="font-semibold text-blue-500 dark:text-blue-300">
            Edu Desk
          </span>{" "}
          makes learning easier, smarter, and more organized.
        </p>
        <div className="mt-8 flex justify-center text-blue-500 dark:text-blue-400 text-3xl">
          <FaBookOpen />
        </div>
      </div>
    </section>
  );
};

export default About;
