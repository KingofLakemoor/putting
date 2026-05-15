import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { RotateCcw } from "lucide-react";

const DiscardModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Discard Round?",
  description = "Are you sure you want to discard this round? This action cannot be undone and your progress will be lost.",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          as={motion.div}
          open={isOpen}
          onClose={onClose}
          className="relative z-50"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-sm bg-dark-surface border border-slate-700/50 rounded-2xl p-6 text-white shadow-xl text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <RotateCcw className="text-red-500" size={32} />
                  </div>
                </div>
                <Dialog.Title className="font-sports text-2xl text-red-500 tracking-wide mb-2">
                  {title}
                </Dialog.Title>
                <Dialog.Description className="text-slate-400 text-sm mb-8">
                  {description}
                </Dialog.Description>

                <div className="flex gap-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onConfirm();
                    }}
                    className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
                  >
                    DISCARD
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default DiscardModal;
