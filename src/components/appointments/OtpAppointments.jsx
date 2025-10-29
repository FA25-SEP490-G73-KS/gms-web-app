import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PhoneVerificationStep1() {
    const [phone, setPhone] = useState("")

    const handleSendOTP = () => {
        if (!phone) return alert("Vui lòng nhập số điện thoại.")
        console.log("Send OTP to:", phone)
    }

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-[#fffaf3] px-4">
            {/* Header */}
            <div className="text-center mb-10">
                <img
                    src="/image/ChatGPT Image 01_29_45 17 thg 10, 2025.png"
                    alt="Logo"
                    className="w-20 mx-auto mb-3"
                />
                <h1 className="text-3xl font-semibold text-[#6f4e37]">
                    Garage <span className="text-black">Hoàng Tuấn</span>
                </h1>
                <p className="mt-2 text-gray-600 text-base">
                    Xin chào, <span className="text-[#c8a76b] font-medium">Huyền</span>
                </p>
            </div>

            {/* Step Progress */}
            <div className="flex items-center gap-2 text-[#c8a76b] mb-4">
                <div className="w-3 h-3 rounded-full bg-[#c8a76b]" />
                <div className="w-10 h-[2px] bg-[#c8a76b]" />
                <div className="w-3 h-3 rounded-full border-2 border-[#c8a76b]" />
                <div className="w-10 h-[2px] bg-[#c8a76b]" />
                <div className="w-3 h-3 rounded-full border-2 border-[#c8a76b]" />
                <div className="w-10 h-[2px] bg-[#c8a76b]" />
                <div className="w-3 h-3 rounded-full border-2 border-[#c8a76b]" />
            </div>

            <p className="text-sm text-gray-700 mb-8">
                Bước 1/4: <span className="text-[#c8a76b] font-medium">Xác thực số điện thoại</span>
            </p>

            {/* Form Card */}
            <Card className="w-full max-w-md bg-white shadow-lg rounded-2xl border-none">
                <CardContent className="p-8 flex flex-col gap-5">
                    <Label className="text-sm font-medium text-gray-700">
                        Vui lòng nhập số điện thoại bạn muốn gửi mã OTP!
                    </Label>
                    <Input
                        placeholder="VD: 0123456789"
                        className="h-11 rounded-xl border-gray-300 focus:ring-[#c8a76b] focus:border-[#c8a76b]"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    <div className="flex justify-between mt-6">
                        <Button
                            variant="outline"
                            className="rounded-xl px-8 py-2 border-gray-700 text-gray-800 hover:bg-gray-100"
                        >
                            Trang chủ
                        </Button>
                        <Button
                            onClick={handleSendOTP}
                            className="bg-[#c8a76b] hover:bg-[#b29261] text-white rounded-xl px-8 py-2"
                        >
                            Gửi mã OTP
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
