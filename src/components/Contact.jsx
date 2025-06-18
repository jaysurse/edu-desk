import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { motion } from "framer-motion";
import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaEnvelope,
  FaPaperPlane,
} from "react-icons/fa";

const Contact = () => {
  const form = useRef();
  const [done, setDone] = useState(false);

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_ib77l4f", // your service ID
        "template_iztqbw5", // your template ID
        form.current,
        "ZWCbX9-oH2IR18HRb" // your public key
      )
      .then(
        (result) => {
          console.log(result.text);
          setDone(true);
          setTimeout(() => setDone(false), 4000); // auto-hide message
        },
        (error) => {
          console.log(error.text);
        }
      );
  };

  return (
    <section id="contact" className="py-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      <div className="max-w-4xl mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-12"
        >
          ✉️ Let's Connect
        </motion.h2>

        {/* Contact Form */}
        <motion.form
          ref={form}
          onSubmit={sendEmail}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg space-y-6"
        >
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            required
            className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            required
            className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows="5"
            required
            className="w-full p-3 rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-400"
          ></textarea>

          <input type="hidden" name="time" value={new Date().toLocaleString()} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-300"
          >
            <FaPaperPlane /> Send Message
          </motion.button>

          {done && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 text-center mt-4 font-medium"
            >
              ✅ Message Sent Successfully!
            </motion.p>
          )}
        </motion.form>

        {/* Social Links */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            🔗 Follow Me On
          </h3>
          <div className="flex justify-center gap-6 text-2xl">
            <a
              href="https://github.com/jaysurse"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white transition duration-300"
            >
              <FaGithub />
            </a>
            <a
              href="https://linkedin.com/in/jay-surse"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition duration-300"
            >
              <FaLinkedin />
            </a>
            <a
              href="https://www.instagram.com/jayy..007?igsh=d2w1eHRhemU0ejd5"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-500 transition duration-300"
            >
              <FaInstagram />
            </a>
            <a
              href="mailto:jaysurse07@gmail.com"
              className="hover:text-green-600 transition duration-300"
            >
              <FaEnvelope />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;
