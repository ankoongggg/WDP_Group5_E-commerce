import { UserService } from "../../services/userService";
import { useEffect, useState } from "react";

export const useAdminHomePage = () => {
    const [totalUsers, setTotalUsers] = useState();
    const [comparison, setComparison] = useState();
    const [isPositive, setIsPositive] = useState(true);
    const [loading,setLoading] = useState(true);

    useEffect(()=>{
        const fetchData = async () =>{
            try{
                setLoading(true);
                const res = await UserService.getNumberAndComparison();
                console.log('raw response from service', res,);
                if (res) {
                    setTotalUsers(res.totalUsers ?? 0);
                    setComparison(res.comparison ?? 0);
                    setIsPositive((res.comparison ?? 0) >= 0);
                } else {
                    console.warn('getNumberAndComparison returned undefined');
                }
            }
            catch(err){
                console.error('Failed to fetch user data', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [])

    return {totalUsers, comparison, isPositive, setIsPositive, loading};

}