import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
        host: '0.0.0.0', // Permite que o servidor oiça outras máquinas
        cors: true,
        /*hmr: {
            host: '192.168.0.185', // FORÇA o Vite a injetar o teu IP real no HTML!
        },*/
    },
});
