const Resizable = require('react-resizable-panels');
console.log('Keys:', Object.keys(Resizable));
if (!Resizable.Group) {
    console.error('Group is missing!');
    process.exit(1);
}
console.log('Group exists.');
