class ApiResponse{
    constructor(statuscode, data = null, message = "success"){
        this.statuscode = statuscode
        this.data = data
        this.message = message
        this.success = statuscode < 400
    }
}