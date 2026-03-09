"use client";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import OptimizedReports from "@/components/reports/OptimizedReports";

export default function ReportsPage() {
  return (
    <>
      <Helmet>
        <title>RelatÃģrios - ImpÃĐrio Sucata</title>
        <meta
          name="description"
          content="Sistema de relatÃģrios otimizado com exportaÃ§ÃĢo profissional."
        />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-slate-50"
      >
        <OptimizedReports />
      </motion.div>
    </>
  );
}
