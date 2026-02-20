import emailjs from '@emailjs/browser';
import { toast } from 'sonner';

// Keys should ideally be in .env, but for this MVP/demo we might need to ask the user to input them
// or we can structure it to look for them in localStorage or a config file.
// For now, I'll set up placeholders.

export const EmailService = {
    /**
     * Sends an email using EmailJS
     * @param templateParams The data to send in the email template
     */
    sendEmail: async (templateParams: Record<string, unknown>) => {
        const serviceId = localStorage.getItem('EMAILJS_SERVICE_ID') || 'YOUR_SERVICE_ID';
        const templateId = localStorage.getItem('EMAILJS_TEMPLATE_ID') || 'YOUR_TEMPLATE_ID';
        const publicKey = localStorage.getItem('EMAILJS_PUBLIC_KEY') || 'YOUR_PUBLIC_KEY';

        if (serviceId === 'YOUR_SERVICE_ID' || !publicKey) {
            console.warn('EmailJS not configured. Falling back to simulation.');
            return false; // Indicating simulated was used
        }

        try {
            await emailjs.send(serviceId, templateId, templateParams, publicKey);
            return true; // Sent successfully
        } catch (error) {
            console.error('Failed to send email:', error);
            toast.error('Error al enviar correo real (revisa la consola)');
            return false;
        }
    },

    /**
     * Saves the email credentials to localStorage
     */
    saveCredentials: (serviceId: string, templateId: string, publicKey: string) => {
        localStorage.setItem('EMAILJS_SERVICE_ID', serviceId);
        localStorage.setItem('EMAILJS_TEMPLATE_ID', templateId);
        localStorage.setItem('EMAILJS_PUBLIC_KEY', publicKey);
    }
};
