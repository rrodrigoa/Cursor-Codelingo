/* CodeLingo App (vanilla JS) */
(function() {
  'use strict';

  const STORAGE_KEY = 'codelingo_state_v1';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const todayISO = () => new Date().toISOString().slice(0, 10);
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / (1000*60*60*24));

  const defaultState = () => ({
    theme: 'light',
    selectedCourse: 'python',
    xp: 0,
    hearts: 5,
    streak: 0,
    lastPlayDate: null,
    courses: {
      cpp: initCourse('cpp'),
      python: initCourse('python'),
      java: initCourse('java'),
    },
    badges: [],
  });

  function initCourse(id) {
    return {
      id,
      units: generateUnits(id),
      lastUnitIndex: 0,
      lastLessonIndex: 0,
      unlockedUnits: 1,
    };
  }

  const UNIT_TITLES = [
    'Intro & Tooling', 'Variables', 'Expressions & Operators', 'Console I/O', 'Conditionals', 'Loops',
    'Functions/Methods', 'Strings', 'Arrays/Lists', 'Maps/Dictionaries', 'Debugging', 'Big‑O Intuition',
    'File I/O', 'Classes & Objects', 'Testing & Edge Cases', 'Recursion', 'Search', 'Sort', 'Errors/Exceptions', 'Final Review'
  ];

  // Per-language, per-unit question bank (no reuse across languages)
  const COURSE_QUESTION_BANK = {
    cpp: {
      0: [
        { type: 'mcq', prompt: 'C++ setup: What is a key first step?', options: ['Only memorize syntax', 'Set up compiler and editor', 'Ignore build tools'], correctIndex: 1, hint: 'You need tools before you can build.' },
        { type: 'fill', prompt: 'Compile a C++ file', code: 'g++ __.cpp -o program', answer: 'main', hint: 'Replace with your source file name without extension.' },
        { type: 'tf', prompt: 'An IDE is required to write C++ code.', statement: 'An IDE is required to write code.', answer: false, hint: 'You can code with any editor + compiler.' }
      ],
      1: [
        { type: 'mcq', prompt: 'In C++, a variable is…', options: ['A function', 'A container for data', 'A header file'], correctIndex: 1, hint: 'It stores values.' },
        { type: 'fill', prompt: 'Declare an int variable', code: 'int __ = 25;', answer: 'age', hint: 'Use a descriptive name.' },
        { type: 'tf', prompt: 'Variable names can start with a number in C++.', statement: 'Variable names can start with a number.', answer: false, hint: 'Must start with letter or underscore.' }
      ],
      2: [
        { type: 'mcq', prompt: 'The % operator in C++ does…', options: ['Division', 'Multiplication', 'Modulo'], correctIndex: 2, hint: 'Remainder operator.' },
        { type: 'fill', prompt: 'Compute 7 % 3', code: '7 % 3 = __', answer: '1', hint: 'Remainder after division.' },
        { type: 'tf', prompt: 'The + operator is only numeric.', statement: 'The + operator can only be used with numbers.', answer: false, hint: 'It can concatenate std::string too.' }
      ],
      3: [
        { type: 'mcq', prompt: 'I/O means…', options: ['Input/Output', 'Inside/Outside', 'Init/Override'], correctIndex: 0, hint: 'Data in and out.' },
        { type: 'fill', prompt: 'Print Hello in C++', code: 'std::cout << __ << std::endl;', answer: '"Hello"', hint: 'Strings need quotes.' },
        { type: 'tf', prompt: 'Console input always returns a string in C++.', statement: 'Console input always returns a string.', answer: false, hint: 'Formatted extraction parses types.' }
      ],
      4: [
        { type: 'mcq', prompt: 'Start an if in C++', options: ['when', 'if', 'check'], correctIndex: 1, hint: 'Basic conditional.' },
        { type: 'fill', prompt: 'Compare x and 10', code: 'if (x __ 10) {', answer: '>', hint: 'Greater than.' },
        { type: 'tf', prompt: 'else is mandatory in C++ if.', statement: 'An if statement must have an else clause.', answer: false, hint: 'Optional.' }
      ],
      5: [
        { type: 'mcq', prompt: 'Which loop runs at least once?', options: ['for', 'while', 'do-while'], correctIndex: 2, hint: 'Condition checked after body.' },
        { type: 'fill', prompt: 'For loop header', code: 'for (int i = 0; i __ 10; i++)', answer: '<', hint: 'Loop while less than 10.' },
        { type: 'tf', prompt: 'Infinite loops are always bad.', statement: 'Infinite loops are always bad.', answer: false, hint: 'Servers often loop forever.' }
      ],
      6: [
        { type: 'mcq', prompt: 'A function parameter is…', options: ['Return value', 'Input to the function', 'The function name'], correctIndex: 1, hint: 'What goes in.' },
        { type: 'fill', prompt: 'Second parameter name', code: 'int add(int a, int __)', answer: 'b', hint: 'Common example.' },
        { type: 'tf', prompt: 'All functions must return a value.', statement: 'All functions must return a value.', answer: false, hint: 'void exists.' }
      ],
      7: [
        { type: 'mcq', prompt: 'String concatenation in C++', options: ['Split', 'Join', 'Compare'], correctIndex: 1, hint: 'Combine text.' },
        { type: 'fill', prompt: 'Join strings', code: 'std::string s = std::string("Hello") + __ + "World";', answer: '" "', hint: 'Space between words.' },
        { type: 'tf', prompt: 'String indices start at 1.', statement: 'String indices start at 1.', answer: false, hint: '0-based.' }
      ],
      8: [
        { type: 'mcq', prompt: 'Array index means…', options: ['Name', 'Position', 'Size'], correctIndex: 1, hint: 'Access position.' },
        { type: 'fill', prompt: 'First element', code: 'arr[__]', answer: '0', hint: 'Zero-based.' },
        { type: 'tf', prompt: 'C++ arrays have uniform type.', statement: 'All arrays have the same data type.', answer: true, hint: 'Static types.' }
      ],
      9: [
        { type: 'mcq', prompt: 'Key-value pair is…', options: ['Two arrays', 'Map from key to value', 'A loop'], correctIndex: 1, hint: 'std::map.' },
        { type: 'fill', prompt: 'Insert into std::map', code: 'm["__"] = 42;', answer: 'answer', hint: 'Pick a key.' },
        { type: 'tf', prompt: 'Map keys must be unique.', statement: 'Dictionary keys must be unique.', answer: true, hint: 'Latest wins.' }
      ],
      10: [
        { type: 'mcq', prompt: 'Breakpoint is…', options: ['Syntax error', 'Pause point', 'Variable type'], correctIndex: 1, hint: 'Debugger stops.' },
        { type: 'fill', prompt: 'Debugging finds __', code: 'Debugging finds __', answer: 'bugs', hint: 'In the name.' },
        { type: 'tf', prompt: 'Prints are debugging too.', statement: 'Print statements are a form of debugging.', answer: true, hint: 'Trace with cout.' }
      ],
      11: [
        { type: 'mcq', prompt: 'Big-O measures…', options: ['Code length', 'Algorithm efficiency', 'Memory brand'], correctIndex: 1, hint: 'Performance.' },
        { type: 'fill', prompt: 'O(1) means __ time', code: 'O(1) means __ time', answer: 'constant', hint: 'Independent of n.' },
        { type: 'tf', prompt: 'Big-O is exact timing.', statement: 'Big-O notation is always exact.', answer: false, hint: 'Asymptotic bound.' }
      ],
      12: [
        { type: 'mcq', prompt: 'Read a file means…', options: ['Open for input', 'Open for output', 'Delete file'], correctIndex: 0, hint: 'ifstream.' },
        { type: 'fill', prompt: 'Open file for reading', code: 'std::ifstream file(__);', answer: '"data.txt"', hint: 'Provide path.' },
        { type: 'tf', prompt: 'Always close files.', statement: 'Files must always be closed after use.', answer: true, hint: 'Or rely on RAII.' }
      ],
      13: [
        { type: 'mcq', prompt: 'Object is…', options: ['A variable', 'Instance of a class', 'A function'], correctIndex: 1, hint: 'OOP.' },
        { type: 'fill', prompt: 'Declare a Car object', code: 'Car __;', answer: 'myCar', hint: 'Name your object.' },
        { type: 'tf', prompt: 'All classes need explicit ctor.', statement: 'All classes must have a constructor.', answer: false, hint: 'Default may exist.' }
      ],
      14: [
        { type: 'mcq', prompt: 'Edge case means…', options: ['Syntax error', 'Unusual input/boundary', 'A loop'], correctIndex: 1, hint: 'Boundary conditions.' },
        { type: 'fill', prompt: 'Test with __ input', code: 'Test with __ input', answer: 'empty', hint: 'Common case.' },
        { type: 'tf', prompt: 'Edge cases are optional.', statement: 'Edge cases are not important to test.', answer: false, hint: 'They reveal bugs.' }
      ],
      15: [
        { type: 'mcq', prompt: 'Recursion is…', options: ['Loop type', 'Function calls itself', 'Data type'], correctIndex: 1, hint: 'Self-reference.' },
        { type: 'fill', prompt: 'Every recursion needs a __ case', code: 'Every recursive function needs a __ case', answer: 'base', hint: 'Stop condition.' },
        { type: 'tf', prompt: 'Recursion uses less memory than loops.', statement: 'Recursion always uses less memory than loops.', answer: false, hint: 'Stack frames.' }
      ],
      16: [
        { type: 'mcq', prompt: 'Linear search is…', options: ['Check in order', 'Binary tree', 'Hashing'], correctIndex: 0, hint: 'One by one.' },
        { type: 'fill', prompt: 'Binary search requires __ data', code: 'Binary search requires __ data', answer: 'sorted', hint: 'Ordered data.' },
        { type: 'tf', prompt: 'Binary is always faster.', statement: 'Binary search is always faster than linear search.', answer: false, hint: 'Small n exceptions.' }
      ],
      17: [
        { type: 'mcq', prompt: 'Bubble sort is…', options: ['Fast', 'Simple but slow', 'Search algorithm'], correctIndex: 1, hint: 'Educational.' },
        { type: 'fill', prompt: 'Arrange in __ order', code: 'Sort algorithms arrange data in __ order', answer: 'ascending', hint: 'Small to large.' },
        { type: 'tf', prompt: 'All sorting has same complexity.', statement: 'All sorting algorithms have the same time complexity.', answer: false, hint: 'They differ.' }
      ],
      18: [
        { type: 'mcq', prompt: 'Exception is…', options: ['Syntax error', 'Handleable runtime error', 'Logical proof'], correctIndex: 1, hint: 'try/catch.' },
        { type: 'fill', prompt: 'Complete try/catch', code: 'try { /* code */ } __ (const std::exception& e) {', answer: 'catch', hint: 'Keyword to handle.' },
        { type: 'tf', prompt: 'All exceptions must be caught.', statement: 'All exceptions must be caught.', answer: false, hint: 'May propagate.' }
      ],
      19: [
        { type: 'mcq', prompt: 'This course covered…', options: ['Only syntax', 'Fundamentals + problem solving', 'Just IDE usage'], correctIndex: 1, hint: 'Big picture.' },
        { type: 'fill', prompt: 'Programming is about solving __', code: 'Programming is about solving __', answer: 'problems', hint: 'Core goal.' },
        { type: 'tf', prompt: 'Learning is one-time.', statement: 'Learning to code is a one-time process.', answer: false, hint: 'Continuous learning.' }
      ],
    },
    python: {
      0: [
        { type: 'mcq', prompt: 'Python setup: first step?', options: ['Memorize syntax', 'Install Python and an editor', 'Ignore tooling'], correctIndex: 1, hint: 'You need the interpreter installed.' },
        { type: 'fill', prompt: 'Run a Python file', code: 'python __.py', answer: 'script', hint: 'Use the filename without extension for the blank.' },
        { type: 'tf', prompt: 'You must use an IDE for Python.', statement: 'An IDE is required to write code.', answer: false, hint: 'Any text editor works.' }
      ],
      1: [
        { type: 'mcq', prompt: 'A variable in Python is…', options: ['A function', 'A name bound to a value', 'A module'], correctIndex: 1, hint: 'Binding names to objects.' },
        { type: 'fill', prompt: 'Assign an integer', code: 'age = __', answer: '25', hint: 'Simple assignment.' },
        { type: 'tf', prompt: 'Names can start with a digit.', statement: 'Variable names can start with a number.', answer: false, hint: 'Must start with a letter or _.' }
      ],
      2: [
        { type: 'mcq', prompt: '% operator in Python does…', options: ['Division', 'Exponent', 'Modulo'], correctIndex: 2, hint: 'Remainder operator.' },
        { type: 'fill', prompt: 'Compute 7 % 3', code: '7 % 3 == __', answer: '1', hint: 'Remainder is 1.' },
        { type: 'tf', prompt: '+ only for numbers.', statement: 'The + operator can only be used with numbers.', answer: false, hint: 'It concatenates strings and lists too.' }
      ],
      3: [
        { type: 'mcq', prompt: 'I/O stands for…', options: ['Input/Output', 'Index/Order', 'Init/Override'], correctIndex: 0, hint: 'Interacting with users/files.' },
        { type: 'fill', prompt: 'Print Hello', code: 'print(__)', answer: '"Hello"', hint: 'Strings need quotes.' },
        { type: 'tf', prompt: 'input() returns a string.', statement: 'Console input always returns a string.', answer: true, hint: 'Cast to int if needed.' }
      ],
      4: [
        { type: 'mcq', prompt: 'Conditional keyword', options: ['when', 'if', 'case'], correctIndex: 1, hint: 'Basic control flow.' },
        { type: 'fill', prompt: 'Compare x and 10', code: 'if x __ 10:', answer: '>', hint: 'Greater than.' },
        { type: 'tf', prompt: 'else is required', statement: 'An if statement must have an else clause.', answer: false, hint: 'Optional.' }
      ],
      5: [
        { type: 'mcq', prompt: 'Loop that runs at least once?', options: ['for', 'while', 'do-while'], correctIndex: 0, hint: 'Python has no do-while.' },
        { type: 'fill', prompt: 'Range loop', code: 'for i in range(__):', answer: '10', hint: '0..9' },
        { type: 'tf', prompt: 'Infinite loops are always bad.', statement: 'Infinite loops are always bad.', answer: false, hint: 'Event loops run forever.' }
      ],
      6: [
        { type: 'mcq', prompt: 'Function parameter is…', options: ['Return value', 'Input to function', 'Decorator'], correctIndex: 1, hint: 'Inputs.' },
        { type: 'fill', prompt: 'Second parameter name', code: 'def add(a, __):', answer: 'b', hint: 'Common example.' },
        { type: 'tf', prompt: 'All functions must return.', statement: 'All functions must return a value.', answer: false, hint: 'Implicit None.' }
      ],
      7: [
        { type: 'mcq', prompt: 'Concatenate strings', options: ['Split', 'Join', 'Slice'], correctIndex: 1, hint: 'Combine text.' },
        { type: 'fill', prompt: 'Concatenate', code: '"Hello" + __ + "World"', answer: '" "', hint: 'Space.' },
        { type: 'tf', prompt: 'Indices start at 1.', statement: 'String indices start at 1.', answer: false, hint: '0-based.' }
      ],
      8: [
        { type: 'mcq', prompt: 'List index is…', options: ['Name', 'Position', 'Type'], correctIndex: 1, hint: 'Access position.' },
        { type: 'fill', prompt: 'First element', code: 'arr[__]', answer: '0', hint: 'Zero-based.' },
        { type: 'tf', prompt: 'Lists are homogeneous.', statement: 'All arrays have the same data type.', answer: false, hint: 'Python lists can mix types.' }
      ],
      9: [
        { type: 'mcq', prompt: 'Key-value pair is…', options: ['Two lists', 'Mapping from key to value', 'Loop'], correctIndex: 1, hint: 'dict.' },
        { type: 'fill', prompt: 'Create a dict entry', code: 'm["__"] = 42', answer: 'answer', hint: 'Choose a key.' },
        { type: 'tf', prompt: 'Dict keys must be unique.', statement: 'Dictionary keys must be unique.', answer: true, hint: 'Overwrites previous.' }
      ],
      10: [
        { type: 'mcq', prompt: 'Breakpoint is…', options: ['Syntax error', 'Pause point', 'Package'], correctIndex: 1, hint: 'Debugger stops.' },
        { type: 'fill', prompt: 'Debugging finds __', code: 'Debugging finds __', answer: 'bugs', hint: 'In the name.' },
        { type: 'tf', prompt: 'Prints are debugging too.', statement: 'Print statements are a form of debugging.', answer: true, hint: 'Trace with print().' }
      ],
      11: [
        { type: 'mcq', prompt: 'Big-O measures…', options: ['Lines', 'Efficiency', 'Imports'], correctIndex: 1, hint: 'Performance.' },
        { type: 'fill', prompt: 'O(1) means __ time', code: 'O(1) means __ time', answer: 'constant', hint: 'Independent of n.' },
        { type: 'tf', prompt: 'Big-O is exact.', statement: 'Big-O notation is always exact.', answer: false, hint: 'Asymptotic bound.' }
      ],
      12: [
        { type: 'mcq', prompt: 'Read a file mode', options: ['"r"', '"w"', '"a"'], correctIndex: 0, hint: 'Read begins with r.' },
        { type: 'fill', prompt: 'Open file for reading', code: 'file = open("data.txt", "__")', answer: '"r"', hint: 'Use the read mode.' },
        { type: 'tf', prompt: 'Always close files.', statement: 'Files must always be closed after use.', answer: true, hint: 'With or context manager.' }
      ],
      13: [
        { type: 'mcq', prompt: 'Object is…', options: ['Variable', 'Instance of a class', 'Function'], correctIndex: 1, hint: 'OOP.' },
        { type: 'fill', prompt: 'Instantiate Car', code: '__ = Car()', answer: 'my_car', hint: 'Assign to a variable.' },
        { type: 'tf', prompt: 'All classes need a constructor.', statement: 'All classes must have a constructor.', answer: false, hint: 'Default __init__ optional.' }
      ],
      14: [
        { type: 'mcq', prompt: 'Edge case means…', options: ['Syntax error', 'Unusual input/boundary', 'Loop'], correctIndex: 1, hint: 'Boundary conditions.' },
        { type: 'fill', prompt: 'Test with __ input', code: 'Test with __ input', answer: 'empty', hint: 'Common case.' },
        { type: 'tf', prompt: 'Edge cases are optional.', statement: 'Edge cases are not important to test.', answer: false, hint: 'They reveal bugs.' }
      ],
      15: [
        { type: 'mcq', prompt: 'Recursion is…', options: ['Loop', 'Function calls itself', 'Class'], correctIndex: 1, hint: 'Self-reference.' },
        { type: 'fill', prompt: 'Every recursion needs a __ case', code: 'Every recursive function needs a __ case', answer: 'base', hint: 'Stop condition.' },
        { type: 'tf', prompt: 'Recursion uses less memory.', statement: 'Recursion always uses less memory than loops.', answer: false, hint: 'Stack frames.' }
      ],
      16: [
        { type: 'mcq', prompt: 'Linear search is…', options: ['Check in order', 'Binary tree', 'Hashing'], correctIndex: 0, hint: 'One by one.' },
        { type: 'fill', prompt: 'Binary search requires __ data', code: 'Binary search requires __ data', answer: 'sorted', hint: 'Ordered data.' },
        { type: 'tf', prompt: 'Binary is always faster.', statement: 'Binary search is always faster than linear search.', answer: false, hint: 'Small n exceptions.' }
      ],
      17: [
        { type: 'mcq', prompt: 'Bubble sort is…', options: ['Fast', 'Simple but slow', 'Search alg'], correctIndex: 1, hint: 'Educational.' },
        { type: 'fill', prompt: 'Arrange in __ order', code: 'Sort algorithms arrange data in __ order', answer: 'ascending', hint: 'Small to large.' },
        { type: 'tf', prompt: 'All sorting same complexity.', statement: 'All sorting algorithms have the same time complexity.', answer: false, hint: 'They differ.' }
      ],
      18: [
        { type: 'mcq', prompt: 'Exception is…', options: ['Syntax error', 'Handleable runtime error', 'Logical proof'], correctIndex: 1, hint: 'try/except.' },
        { type: 'fill', prompt: 'Complete try/except', code: 'try:\n    ...\n__ Exception as e:\n    ...', answer: 'except', hint: 'Keyword.' },
        { type: 'tf', prompt: 'All exceptions must be caught.', statement: 'All exceptions must be caught.', answer: false, hint: 'They can propagate.' }
      ],
      19: [
        { type: 'mcq', prompt: 'This course covered…', options: ['Only syntax', 'Fundamentals + problem solving', 'Just IDE usage'], correctIndex: 1, hint: 'Big picture.' },
        { type: 'fill', prompt: 'Programming is about solving __', code: 'Programming is about solving __', answer: 'problems', hint: 'Core goal.' },
        { type: 'tf', prompt: 'Learning is one-time.', statement: 'Learning to code is a one-time process.', answer: false, hint: 'Continuous learning.' }
      ],
    },
    java: {
      0: [
        { type: 'mcq', prompt: 'Java setup: first step?', options: ['Memorize syntax', 'Install JDK and an editor', 'Ignore tooling'], correctIndex: 1, hint: 'You need the JDK.' },
        { type: 'fill', prompt: 'Compile a Java class', code: 'javac __.java', answer: 'Main', hint: 'Use class name without extension.' },
        { type: 'tf', prompt: 'An IDE is required for Java.', statement: 'An IDE is required to write code.', answer: false, hint: 'Any editor works.' }
      ],
      1: [
        { type: 'mcq', prompt: 'A variable in Java is…', options: ['A function', 'A container for data', 'A package'], correctIndex: 1, hint: 'Stores values.' },
        { type: 'fill', prompt: 'Declare an int', code: 'int __ = 25;', answer: 'age', hint: 'Choose a name.' },
        { type: 'tf', prompt: 'Names can start with a digit.', statement: 'Variable names can start with a number.', answer: false, hint: 'Must start with a letter or _.' }
      ],
      2: [
        { type: 'mcq', prompt: 'The % operator in Java does…', options: ['Division', 'Multiplication', 'Modulo'], correctIndex: 2, hint: 'Remainder.' },
        { type: 'fill', prompt: 'Compute 7 % 3', code: '7 % 3 == __', answer: '1', hint: 'Remainder is 1.' },
        { type: 'tf', prompt: '+ only for numbers.', statement: 'The + operator can only be used with numbers.', answer: false, hint: 'Concatenates strings too.' }
      ],
      3: [
        { type: 'mcq', prompt: 'I/O stands for…', options: ['Input/Output', 'Index/Order', 'Init/Override'], correctIndex: 0, hint: 'Interacting with users/files.' },
        { type: 'fill', prompt: 'Print Hello', code: 'System.out.println(__);', answer: '"Hello"', hint: 'Strings need quotes.' },
        { type: 'tf', prompt: 'Scanner.nextLine returns String.', statement: 'Console input always returns a string.', answer: true, hint: 'Scanner can parse ints too.' }
      ],
      4: [
        { type: 'mcq', prompt: 'Conditional keyword', options: ['when', 'if', 'case'], correctIndex: 1, hint: 'Basic control flow.' },
        { type: 'fill', prompt: 'Compare x and 10', code: 'if (x __ 10) {', answer: '>', hint: 'Greater than.' },
        { type: 'tf', prompt: 'else is required', statement: 'An if statement must have an else clause.', answer: false, hint: 'Optional.' }
      ],
      5: [
        { type: 'mcq', prompt: 'Loop that runs at least once?', options: ['for', 'while', 'do-while'], correctIndex: 2, hint: 'Condition checked after body.' },
        { type: 'fill', prompt: 'For loop header', code: 'for (int i = 0; i __ 10; i++)', answer: '<', hint: '0..9' },
        { type: 'tf', prompt: 'Infinite loops are always bad.', statement: 'Infinite loops are always bad.', answer: false, hint: 'Event loops run forever.' }
      ],
      6: [
        { type: 'mcq', prompt: 'Function parameter is…', options: ['Return value', 'Input to method', 'Class name'], correctIndex: 1, hint: 'Inputs.' },
        { type: 'fill', prompt: 'Second parameter', code: 'int add(int a, int __)', answer: 'b', hint: 'Common example.' },
        { type: 'tf', prompt: 'All methods must return.', statement: 'All functions must return a value.', answer: false, hint: 'void returns nothing.' }
      ],
      7: [
        { type: 'mcq', prompt: 'Concatenate strings', options: ['Split', 'Join', 'Slice'], correctIndex: 1, hint: 'Combine text.' },
        { type: 'fill', prompt: 'Concatenate', code: '"Hello" + __ + "World"', answer: '" "', hint: 'Space.' },
        { type: 'tf', prompt: 'Indices start at 1.', statement: 'String indices start at 1.', answer: false, hint: '0-based.' }
      ],
      8: [
        { type: 'mcq', prompt: 'Array index is…', options: ['Name', 'Position', 'Type'], correctIndex: 1, hint: 'Access position.' },
        { type: 'fill', prompt: 'First element', code: 'arr[__]', answer: '0', hint: 'Zero-based.' },
        { type: 'tf', prompt: 'Arrays homogeneous.', statement: 'All arrays have the same data type.', answer: true, hint: 'Java arrays are typed.' }
      ],
      9: [
        { type: 'mcq', prompt: 'Key-value pair is…', options: ['Two lists', 'Mapping from key to value', 'Loop'], correctIndex: 1, hint: 'Map<K,V>.' },
        { type: 'fill', prompt: 'Put into map', code: 'map.put("__", 42);', answer: 'answer', hint: 'Choose a key.' },
        { type: 'tf', prompt: 'Map keys must be unique.', statement: 'Dictionary keys must be unique.', answer: true, hint: 'Overwrites previous.' }
      ],
      10: [
        { type: 'mcq', prompt: 'Breakpoint is…', options: ['Syntax error', 'Pause point', 'Package'], correctIndex: 1, hint: 'Debugger stops.' },
        { type: 'fill', prompt: 'Debugging finds __', code: 'Debugging finds __', answer: 'bugs', hint: 'In the name.' },
        { type: 'tf', prompt: 'Prints are debugging too.', statement: 'Print statements are a form of debugging.', answer: true, hint: 'Trace with System.out.' }
      ],
      11: [
        { type: 'mcq', prompt: 'Big-O measures…', options: ['Lines', 'Efficiency', 'Imports'], correctIndex: 1, hint: 'Performance.' },
        { type: 'fill', prompt: 'O(1) means __ time', code: 'O(1) means __ time', answer: 'constant', hint: 'Independent of n.' },
        { type: 'tf', prompt: 'Big-O is exact.', statement: 'Big-O notation is always exact.', answer: false, hint: 'Asymptotic bound.' }
      ],
      12: [
        { type: 'mcq', prompt: 'Read a file action', options: ['Read', 'Write', 'Append'], correctIndex: 0, hint: 'First option.' },
        { type: 'fill', prompt: 'Open file for reading', code: 'new FileReader(__);', answer: '"data.txt"', hint: 'Provide path.' },
        { type: 'tf', prompt: 'Always close files.', statement: 'Files must always be closed after use.', answer: true, hint: 'Or use try-with-resources.' }
      ],
      13: [
        { type: 'mcq', prompt: 'Object is…', options: ['Variable', 'Instance of a class', 'Function'], correctIndex: 1, hint: 'OOP.' },
        { type: 'fill', prompt: 'Instantiate Car', code: 'Car myCar = __ Car();', answer: 'new', hint: 'Keyword to create.' },
        { type: 'tf', prompt: 'All classes need a constructor.', statement: 'All classes must have a constructor.', answer: false, hint: 'Default constructor.' }
      ],
      14: [
        { type: 'mcq', prompt: 'Edge case means…', options: ['Syntax error', 'Unusual input/boundary', 'Loop'], correctIndex: 1, hint: 'Boundary conditions.' },
        { type: 'fill', prompt: 'Test with __ input', code: 'Test with __ input', answer: 'empty', hint: 'Common case.' },
        { type: 'tf', prompt: 'Edge cases are optional.', statement: 'Edge cases are not important to test.', answer: false, hint: 'They reveal bugs.' }
      ],
      15: [
        { type: 'mcq', prompt: 'Recursion is…', options: ['Loop', 'Function calls itself', 'Class'], correctIndex: 1, hint: 'Self-reference.' },
        { type: 'fill', prompt: 'Every recursion needs a __ case', code: 'Every recursive function needs a __ case', answer: 'base', hint: 'Stop condition.' },
        { type: 'tf', prompt: 'Recursion uses less memory.', statement: 'Recursion always uses less memory than loops.', answer: false, hint: 'Stack frames.' }
      ],
      16: [
        { type: 'mcq', prompt: 'Linear search is…', options: ['Check in order', 'Binary tree', 'Hashing'], correctIndex: 0, hint: 'One by one.' },
        { type: 'fill', prompt: 'Binary search requires __ data', code: 'Binary search requires __ data', answer: 'sorted', hint: 'Ordered data.' },
        { type: 'tf', prompt: 'Binary is always faster.', statement: 'Binary search is always faster than linear search.', answer: false, hint: 'Small n exceptions.' }
      ],
      17: [
        { type: 'mcq', prompt: 'Bubble sort is…', options: ['Fast', 'Simple but slow', 'Search alg'], correctIndex: 1, hint: 'Educational.' },
        { type: 'fill', prompt: 'Arrange in __ order', code: 'Sort algorithms arrange data in __ order', answer: 'ascending', hint: 'Small to large.' },
        { type: 'tf', prompt: 'All sorting same complexity.', statement: 'All sorting algorithms have the same time complexity.', answer: false, hint: 'They differ.' }
      ],
      18: [
        { type: 'mcq', prompt: 'Exception is…', options: ['Syntax error', 'Handleable runtime error', 'Logical proof'], correctIndex: 1, hint: 'try/catch.' },
        { type: 'fill', prompt: 'Complete try/catch', code: 'try { /* code */ } __ (Exception e) {', answer: 'catch', hint: 'Keyword.' },
        { type: 'tf', prompt: 'All exceptions must be caught.', statement: 'All exceptions must be caught.', answer: false, hint: 'They can propagate.' }
      ],
      19: [
        { type: 'mcq', prompt: 'This course covered…', options: ['Only syntax', 'Fundamentals + problem solving', 'Just IDE usage'], correctIndex: 1, hint: 'Big picture.' },
        { type: 'fill', prompt: 'Programming is about solving __', code: 'Programming is about solving __', answer: 'problems', hint: 'Core goal.' },
        { type: 'tf', prompt: 'Learning is one-time.', statement: 'Learning to code is a one-time process.', answer: false, hint: 'Continuous learning.' }
      ],
    }
  };

  function generateUnits(courseId) {
    return UNIT_TITLES.map((title, idx) => ({
      index: idx,
      title,
      lessons: generateLessonsForUnit(courseId, title),
      completedLessons: 0,
    }));
  }

  function generateLessonsForUnit(courseId, title) {
    const unitIndex = UNIT_TITLES.indexOf(title);
    return COURSE_QUESTION_BANK[courseId][unitIndex];
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // Ensure structure
      return { ...defaultState(), ...parsed };
    } catch {
      return defaultState();
    }
  }

  let state = loadState();

  // Theme
  document.body.setAttribute('data-theme', state.theme);
  const themeToggle = $('#themeToggle');
  const themeToggleSwitch = $('#themeToggleSwitch');
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    state.theme = theme; saveState();
    if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'dark');
    if (themeToggleSwitch) themeToggleSwitch.checked = theme === 'dark';
  }
  themeToggle?.addEventListener('click', () => applyTheme(state.theme === 'light' ? 'dark' : 'light'));
  themeToggleSwitch?.addEventListener('change', (e) => applyTheme(e.target.checked ? 'dark' : 'light'));

  // Router
  const views = $$('.view');
  function showView(name) {
    views.forEach(v => v.hidden = v.dataset.route !== name);
    // Tabs ARIA
    $$('.tab').forEach(t => t.setAttribute('aria-current', t.dataset.nav === name ? 'page' : 'false'));
    $('#app')?.focus();
  }
  function navigate(hash) {
    const [route, course, unit, lesson] = hash.replace('#', '').split('/');
    switch (route) {
      case 'home': renderHome(); showView('home'); break;
      case 'courses': renderCourses(); showView('courses'); break;
      case 'map': if (course) { renderMap(course); showView('map'); } else { location.hash = '#courses'; } break;
      case 'lesson': if (course && unit && lesson) { startLesson(course, Number(unit), Number(lesson)); showView('lesson'); } else { location.hash = '#home'; } break;
      case 'profile': renderProfile(); showView('profile'); break;
      default: location.hash = '#home';
    }
  }
  window.addEventListener('hashchange', () => navigate(location.hash || '#home'));

  // Event wiring for static controls
  $('#continueBtn')?.addEventListener('click', () => continueLesson());
  $('#pickPathBtn')?.addEventListener('click', () => { location.hash = '#courses'; });
  $('#backToCourses')?.addEventListener('click', () => { location.hash = '#courses'; });
  $('#backToMap')?.addEventListener('click', (e) => { e.preventDefault(); navigate(`#map/${state.selectedCourse}`); });
  $('#resetProgressBtn')?.addEventListener('click', () => { resetProgress(); });
  $('#refillHeartsBtn')?.addEventListener('click', () => { state.hearts = 5; renderHearts(); saveState(); toast('Hearts refilled ❤️'); });
  // Ensure back works even if node is re-rendered or replaced
  document.addEventListener('click', (e) => {
    const backBtn = e.target.closest && e.target.closest('#backToMap');
    if (backBtn) {
      e.preventDefault();
      navigate(`#map/${state.selectedCourse}`);
    }
  });

  // Stats
  function updateStatsUI() {
    $('#stat-streak').textContent = `🔥 ${state.streak}-day streak`;
    $('#stat-xp').textContent = `⭐ ${state.xp} XP`;
    $('#stat-hearts').textContent = `❤️ ${state.hearts}`;
  }

  // Streak handling
  function updateStreakOnOpen() {
    const today = todayISO();
    const last = state.lastPlayDate;
    if (!last) {
      state.streak = 1;
    } else {
      const gap = daysBetween(last, today);
      if (gap === 0) {
        // same day, keep streak
      } else if (gap === 1) {
        state.streak += 1;
      } else if (gap > 1) {
        state.streak = 1;
      }
    }
    state.lastPlayDate = today;
    saveState();
  }
  updateStreakOnOpen();

  // Courses rendering
  function renderHome() {
    updateStatsUI();
    const courseId = state.selectedCourse;
    const course = state.courses[courseId];
    const unit = course.units[course.lastUnitIndex] || course.units[0];
    const completed = unit.completedLessons;
    const total = unit.lessons.length;
    $('#lastUnitCard').innerHTML = `
      <div class="unit-head"><span class="tile-badge">${courseLabel(courseId)}</span></div>
      <div class="unit-title">${unit.title}</div>
      <div class="unit-progress" aria-label="Progress">
        ${Array.from({length: total}).map((_,i)=>`<span class="progress-dot ${i<completed?'done':''}"></span>`).join('')}
      </div>
      <div style="margin-top:12px; display:flex; gap:10px;">
        <button class="btn" id="homeStart">Start lesson</button>
        <button class="btn btn-ghost" id="homeMap">View map</button>
      </div>
    `;
    $('#homeStart')?.addEventListener('click', () => startLesson(courseId, course.lastUnitIndex, unit.completedLessons));
    $('#homeMap')?.addEventListener('click', () => { location.hash = `#map/${courseId}`; });

    // wire pick path tiles
    $$('#view-home .course-tile').forEach(btn => btn.addEventListener('click', () => {
      state.selectedCourse = btn.dataset.course; saveState(); location.hash = `#map/${btn.dataset.course}`;
    }));
  }

  function renderCourses() {
    $$('#view-courses .course-tile').forEach(btn => btn.addEventListener('click', () => {
      state.selectedCourse = btn.dataset.course; saveState(); location.hash = `#map/${btn.dataset.course}`;
    }));
  }

  function renderMap(courseId) {
    const course = state.courses[courseId];
    state.selectedCourse = courseId; saveState();
    const grid = $('#unitGrid');
    grid.innerHTML = '';
    grid.classList.add('unit-path');

    course.units.forEach((u, idx) => {
      if (idx > 0) {
        const connector = document.createElement('div');
        connector.className = 'path-connector';
        connector.setAttribute('aria-hidden', 'true');
        grid.appendChild(connector);
      }

      const unlocked = idx < course.unlockedUnits;
      const completed = u.completedLessons >= u.lessons.length;
      const isActive = unlocked && !completed;

      const node = document.createElement('button');
      node.className = 'path-node';
      node.setAttribute('role', 'listitem');
      node.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
      if (!unlocked) node.classList.add('locked');
      if (completed) node.classList.add('completed');
      if (isActive) node.classList.add('active');

      const lang = courseId;
      const langSnippets = lang === 'cpp'
        ? ['i++', 'std::vector', 'cout <<', 'auto &']
        : lang === 'python'
        ? ['print("hello")', 'for i in', 'def foo():', 'lambda x:']
        : ['System.out.println()', 'foreach', 'List<>', 'new Object()'];
      const floaterSet = [
        { angle: 0, txt: langSnippets[0], acc: 'acc1', delay: '0s', bob: '2.4s' },
        { angle: 120, txt: langSnippets[1], acc: 'acc2', delay: '.25s', bob: '2.8s' },
        { angle: 240, txt: langSnippets[2], acc: 'acc3', delay: '.4s', bob: '2.6s' },
      ];
      const floaters = floaterSet.map((f,i)=>`<span class="floater" style="--angle:${f.angle}deg; --bob:${f.bob}; --delay:${f.delay};"><span class="floater-label ${f.acc}">${f.txt}</span></span>`).join('');

      node.innerHTML = `
        <span class="gear">
          <svg class="gear-svg" width="60" height="60" viewBox="0 0 100 100" aria-hidden="true">
            <g class="gear-rotor">
              <circle cx="50" cy="50" r="20" fill="var(--card)" stroke="var(--border)" stroke-width="4"/>
              <g fill="var(--card)" stroke="var(--border)" stroke-width="4">
                <rect x="48" y="5" width="4" height="16" rx="2"/>
                <rect x="48" y="79" width="4" height="16" rx="2"/>
                <rect x="5" y="48" width="16" height="4" rx="2"/>
                <rect x="79" y="48" width="16" height="4" rx="2"/>
                <rect x="18" y="18" width="14" height="4" rx="2" transform="rotate(-45 25 20)"/>
                <rect x="68" y="78" width="14" height="4" rx="2" transform="rotate(-45 75 80)"/>
                <rect x="78" y="18" width="14" height="4" rx="2" transform="rotate(45 85 20)"/>
                <rect x="18" y="78" width="14" height="4" rx="2" transform="rotate(45 25 80)"/>
              </g>
              <circle cx="50" cy="50" r="10" fill="var(--periwinkle)"/>
            </g>
            <g class="gear-orbit">
              <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(79,93,255,0.25)" stroke-dasharray="6 8"/>
            </g>
          </svg>
          <span class="gear-center">
            <span class="gear-number">${idx+1}</span>
            <span class="gear-dots">${u.lessons.map((_,i)=>`<span class='dot ${i<u.completedLessons?'done':''}'></span>`).join('')}</span>
          </span>
          <span class="floaters-travel front" style="--travel: 140px;">
            <span class="floaters-orbit">
              ${floaters}
            </span>
          </span>
        </span>
        <span class="node-title">${u.title}
          <span class="floaters-travel back" style="--travel: 40px;">
            <span class="floaters-orbit">
              ${floaters}
            </span>
          </span>
        </span>
      `;

      if (unlocked) {
        node.addEventListener('click', () => {
          const lessonIndex = Math.min(u.completedLessons, u.lessons.length-1);
          startLesson(courseId, idx, lessonIndex);
        });
      }

      grid.appendChild(node);
    });
  }

  function courseLabel(id) {
    return id === 'cpp' ? 'C++' : id === 'python' ? 'Python' : 'Java';
  }

  function continueLesson() {
    const c = state.courses[state.selectedCourse];
    const u = c.lastUnitIndex;
    const l = c.lastLessonIndex;
    location.hash = `#lesson/${state.selectedCourse}/${u}/${l}`;
  }

  // Lesson Engine
  let lessonContext = null;

  function startLesson(courseId, unitIndex, lessonIndex) {
    const course = state.courses[courseId];
    lessonContext = { courseId, unitIndex, lessonIndex, tryCount: 0, hinted: false };
    course.lastUnitIndex = unitIndex; course.lastLessonIndex = lessonIndex; saveState();
    renderLesson();
    showView('lesson');
  }

  function renderHearts() {
    const hearts = $('#hearts');
    if (hearts) hearts.innerHTML = '';
  }

  function renderLesson() {
    const { courseId, unitIndex, lessonIndex } = lessonContext;
    const unit = state.courses[courseId].units[unitIndex];
    const lesson = unit.lessons[lessonIndex];

    // progress
    const total = unit.lessons.length;
    const doneCount = unit.completedLessons;
    $('#progressFill').style.width = `${(doneCount/total)*100}%`;
    renderHearts();

    const container = $('#exerciseContainer');
    container.innerHTML = '';

    const prompt = document.createElement('div');
    prompt.className = 'prompt';
    prompt.textContent = lesson.prompt || 'Answer the question';
    container.appendChild(prompt);

    const hintNote = $('#hintNote');
    hintNote.textContent = '';

    if (lesson.type === 'mcq') {
      const answers = document.createElement('div'); answers.className = 'answers';
      lesson.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'answer'; btn.type='button'; btn.textContent = opt; btn.setAttribute('aria-pressed','false');
        btn.addEventListener('click', () => {
          $$('.answer', answers).forEach(b => b.setAttribute('aria-pressed','false'));
          btn.setAttribute('aria-pressed','true');
          container.dataset.selectedIndex = String(idx);
        });
        answers.appendChild(btn);
      });
      container.appendChild(answers);
    } else if (lesson.type === 'fill') {
      const code = document.createElement('pre'); code.className='code-block'; code.textContent = lesson.code;
      const input = document.createElement('input'); input.type='text'; input.className='answer'; input.placeholder='Type your answer'; input.setAttribute('aria-label','Fill the blank');
      input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') checkAnswer(); });
      container.appendChild(code); container.appendChild(input);
    } else if (lesson.type === 'tf') {
      const statement = document.createElement('div'); statement.className='code-block'; statement.textContent = lesson.statement;
      const answers = document.createElement('div'); answers.className='answers';
      ['True','False'].forEach((label, idx) => {
        const btn = document.createElement('button'); btn.className='answer'; btn.type='button'; btn.textContent=label; btn.setAttribute('aria-pressed','false');
        btn.addEventListener('click', ()=>{
          $$('.answer', answers).forEach(b => b.setAttribute('aria-pressed','false'));
          btn.setAttribute('aria-pressed','true');
          container.dataset.selectedValue = String(idx===0);
        });
        answers.appendChild(btn);
      });
      container.appendChild(statement); container.appendChild(answers);
    }

    $('#hintBtn').onclick = () => {
      if (!lesson.hint) { hintNote.textContent = 'No hint available'; return; }
      hintNote.textContent = `Hint: ${lesson.hint}`;
      lessonContext.hinted = true;
    };

    const check = () => checkAnswer();
    $('#checkBtn').onclick = check; $('#checkBtnMobile').onclick = check;
    const skip = () => nextStep();
    $('#skipBtn').onclick = skip; $('#skipBtnMobile').onclick = skip;
  }

  function checkAnswer() {
    const { courseId, unitIndex, lessonIndex } = lessonContext;
    const lesson = state.courses[courseId].units[unitIndex].lessons[lessonIndex];
    let correct = false;

    if (lesson.type === 'mcq') {
      const i = Number($('#exerciseContainer').dataset.selectedIndex ?? -1);
      correct = i === lesson.correctIndex;
    } else if (lesson.type === 'fill') {
      const val = ($('input.answer')?.value ?? '').trim();
      correct = val === lesson.answer;
    } else if (lesson.type === 'tf') {
      const val = $('#exerciseContainer').dataset.selectedValue;
      correct = String(lesson.answer) === String(val);
    }

    if (correct) {
      onCorrect();
    } else {
      onWrong();
    }
  }

  function onCorrect() {
    const { courseId, unitIndex } = lessonContext;
    const unit = state.courses[courseId].units[unitIndex];
    const tryCount = lessonContext.tryCount;
    let gain = 10;
    if (lessonContext.hinted) gain = 5;
    if (tryCount > 0) gain = 0;
    state.xp += gain;
    playConfetti();
    toast(gain > 0 ? `+${gain} XP!` : 'Nice!');

    if (unit.completedLessons < unit.lessons.length) {
      unit.completedLessons += 1;
    }

    // Unlock next unit if finished
    if (unit.completedLessons === unit.lessons.length) {
      const course = state.courses[courseId];
      if (unit.index + 1 > course.lastUnitIndex) course.lastUnitIndex = unit.index; // keep track
      if (course.unlockedUnits < course.units.length && unit.index + 1 === course.unlockedUnits) {
        course.unlockedUnits += 1;
      }
    }

    lessonContext.tryCount = 0; lessonContext.hinted = false;
    saveState();
    nextStep();
  }

  function onWrong() {
    const container = $('#exerciseContainer');
    const selected = $('.answer[aria-pressed="true"]', container) || $('input.answer', container);
    selected && selected.classList.add('wrong');
    setTimeout(()=> selected && selected.classList.remove('wrong'), 400);

    // Lives removed: do not decrement hearts; just allow retry.
    renderHearts(); saveState();
    toast('Try again');
    lessonContext.tryCount += 1;
  }

  function nextStep() {
    const { courseId, unitIndex } = lessonContext;
    const course = state.courses[courseId];
    const unit = course.units[unitIndex];
    if (unit.completedLessons >= unit.lessons.length) {
      // Unit completed - check if there's a next unit
      const nextUnitIndex = unitIndex + 1;
      if (nextUnitIndex < course.units.length) {
        // Auto-advance to next unit
        course.lastUnitIndex = nextUnitIndex;
        course.lastLessonIndex = 0;
        // Unlock the next unit if it's not already unlocked
        if (nextUnitIndex >= course.unlockedUnits) {
          course.unlockedUnits = nextUnitIndex + 1;
        }
        saveState();
        // Start the next unit automatically
        toast(`Unit completed! Starting ${course.units[nextUnitIndex].title} 🚀`);
        startLesson(courseId, nextUnitIndex, 0);
        return;
      } else {
        // All units completed - go back to map
        course.lastUnitIndex = unitIndex;
        course.lastLessonIndex = 0;
      saveState();
        toast('🎉 Congratulations! You completed all units!');
      location.hash = `#map/${courseId}`;
      return;
      }
    } else {
      // Continue with current unit
      course.lastLessonIndex = unit.completedLessons;
      saveState();
      startLesson(courseId, unitIndex, course.lastLessonIndex);
    }
  }

  // Confetti
  function playConfetti() {
    const container = $('#confetti-container');
    for (let i=0; i<20; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.left = `${Math.random()*100}%`;
      piece.style.top = '-10px';
      const colors = ['#00C385', '#4F5DFF', '#FFCB03', '#E91E63'];
      piece.style.background = colors[i % colors.length];
      piece.style.opacity = '1';
      const duration = 1200 + Math.random()*800;
      piece.style.animation = `confettiFall ${duration}ms ease-out forwards`;
      container.appendChild(piece);
      setTimeout(()=>piece.remove(), duration + 100);
    }
  }

  // Toast
  let toastTimeout = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(()=> el.hidden = true, 1500);
  }

  // Accessibility: button ripple coordinates
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--x', `${e.clientX - rect.left}px`);
    btn.style.setProperty('--y', `${e.clientY - rect.top}px`);
  });

  // Keyboard navigation improvements
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#view-home').hidden) return;
      if (!$('#view-lesson').hidden) { location.hash = `#map/${state.selectedCourse}`; }
    }
  });

  function renderProfile() {
    $('#profileStreak').textContent = `${state.streak} days`;
    $('#profileXP').textContent = `${state.xp}`;
    const badgesWrap = $('#badges');
    badgesWrap.innerHTML = '';
    if (state.xp >= 10) badgesWrap.appendChild(makeBadge('First Steps'));
    if (state.streak >= 3) badgesWrap.appendChild(makeBadge('3‑Day Streak'));
    if (state.xp >= 100) badgesWrap.appendChild(makeBadge('Centurion'));
  }
  function makeBadge(label) {
    const el = document.createElement('span'); el.className='badge'; el.innerHTML = `<span class="dot"></span>${label}`; return el;
  }

  function resetProgress() {
    if (!confirm('Reset all progress?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    applyTheme(state.theme);
    navigate('#home');
    toast('Progress reset');
  }

  // Boot
  navigate(location.hash || '#home');
})();