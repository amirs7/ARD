const P = "\\|/-";
let interId = function() {
  let x = 0;
  return setInterval(function() {
    process.stdout.write("\r" + P[x++]);
    x = x % P.length;
  }, 100);
};
interId();