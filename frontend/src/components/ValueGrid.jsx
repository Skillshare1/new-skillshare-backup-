import { motion } from "framer-motion";
import { Shield, Zap, Globe, Coins } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Trustless Escrow",
    description: "Funds are locked in smart contracts until work is verified and completed."
  },
  {
    icon: Zap,
    title: "Instant Settlements",
    description: "Automatic payments released on-chain when tasks are completed."
  },
  {
    icon: Globe,
    title: "Location-Based",
    description: "Find and post tasks in your local area with interactive maps."
  },
  {
    icon: Coins,
    title: "Crypto Payments",
    description: "Accept payments in ETH and other cryptocurrencies worldwide."
  }
];

export default function ValueGrid() {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose SkillSnap?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Built for the future of work with blockchain technology at its core.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 h-full transition-all duration-300 hover:bg-gray-800/70 hover:border-gray-600/50">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 