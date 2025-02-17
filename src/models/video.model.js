import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String, // cloudinary url
        required: true
    },
    thumbnail: {
        type: String,
        required: true   
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, //cloudinary also tells the duration of our video
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

},{timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate)
// aggregation queries are used for filtering, grouping or sorting complex data.
// watch history needs aggregation queries

export const Video = mongoose.model("Video", videoSchema)