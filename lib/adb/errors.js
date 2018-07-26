class ADBError{
 constructor(message, hint){
   this.message = message;
   this.hint = hint;
 }
}

module.exports = ADBError;