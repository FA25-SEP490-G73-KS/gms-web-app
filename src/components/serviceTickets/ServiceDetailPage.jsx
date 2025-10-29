import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function ServiceDetailPage() {
    return (
        <div className="p-6">
            <h2 className="text-xl font-bold text-center mb-6">PHIẾU DỊCH VỤ CHI TIẾT</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardContent className="space-y-2 pt-4">
                        <p><strong>Tên khách hàng:</strong> Nguyễn Văn A</p>
                        <p><strong>Số điện thoại:</strong> 0123456789</p>
                        <p><strong>Loại xe:</strong> Mazda-v3</p>
                        <p><strong>Biển số xe:</strong> 25A-123456</p>
                        <p><strong>Số khung:</strong> 1HGCM82633A123456</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="space-y-2 pt-4">
                        <p><strong>Nhân viên lập báo giá:</strong> Hoàng Văn B</p>
                        <p><strong>Ngày tạo báo giá:</strong> 12/10/2025</p>
                        <div className="flex items-center gap-2">
                            <Label><strong>Kỹ thuật viên sửa chữa:</strong></Label>
                            <Select defaultValue="4">
                                <SelectTrigger className="w-24">
                                    <SelectValue placeholder="Chọn" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p><strong>Loại dịch vụ:</strong> Thay thế phụ tùng</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>BÁO GIÁ CHI TIẾT</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No</TableHead>
                                <TableHead>Tên linh kiện</TableHead>
                                <TableHead className="w-24">Số lượng</TableHead>
                                <TableHead>Đơn giá</TableHead>
                                <TableHead>Thành tiền</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Ghi chú</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>01</TableCell>
                                <TableCell>Linh kiện A</TableCell>
                                <TableCell>
                                    <Input type="number" min="1" defaultValue="1" />
                                </TableCell>
                                <TableCell>1.000.000</TableCell>
                                <TableCell>1.000.000</TableCell>
                                <TableCell>
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                    Còn hàng
                  </span>
                                </TableCell>
                                <TableCell>
                                    <Input defaultValue="ABC" />
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <Button variant="ghost" className="mt-3 text-blue-600">
                        + Thêm linh kiện
                    </Button>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Tổng tiền hàng</Label>
                            <span>1.000.000</span>
                        </div>
                        <div className="flex justify-between">
                            <Label>Tiền công</Label>
                            <Input defaultValue="1.000.000" className="w-32 text-right" />
                        </div>
                        <div className="flex justify-between">
                            <Label>Thành tiền</Label>
                            <span className="font-semibold">2.000.000</span>
                        </div>
                        <div className="flex justify-between">
                            <Label>Bằng chữ</Label>
                            <span>Hai triệu đồng</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button variant="destructive">Thanh toán</Button>
                <Button variant="secondary">Xuất PDF</Button>
                <Button className="bg-green-500 hover:bg-green-600 text-white">Gửi</Button>
            </div>
        </div>
    )
}
