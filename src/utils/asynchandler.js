const asyncWrapper = function (fn) {
     return (req,res,next) => {
        Promise.resolve(fn(req,res,next)).catch((error) => {
            next(error)
            console.log("error catched by asynchandler");
       })
    }
}
export {asyncWrapper}