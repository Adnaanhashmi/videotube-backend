class Apiresponse {
    constructor(
        message,
        data,
        statuscode,
        success
    ){
        this.message = message
        this.data = data
        this.statuscode = statuscode
        this.success = statuscode < 400
    }
}
export default Apiresponse