import React,{useState} from 'react'
import axios from "axios"
export default function SendWebLink() {
    const [url,setUrl] = useState("")
    const [urlData, setUrlData] = useState({
        title: "",
        text: [],
        images: []
    })
    const handleSendLink = async() => {
        try {
            const resp = await axios.post("http://localhost:8000/scraper",{
                url
            });
            if(resp.data){
                // console.log(resp.data)
                setUrlData(resp.data)
                
            }
        } catch (error) {
            console.log(error.message)
        }
    }
    console.log("These are the images",urlData.images)
  return (
    <div>
        <h1>Give url</h1>
        <input type="text" value={url} onChange={(e)=>setUrl(e.target.value)}/>
        <button onClick={handleSendLink}>Send url</button>
        <div>
            {urlData.images.map((image, index) => (
                <img key={index} src={image} alt="" />
            ))}
        </div>
    </div>
  )
}
