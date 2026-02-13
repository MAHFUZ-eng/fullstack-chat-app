import React from "react";
import { Link, useLocation } from "react-router-dom"; // Added useLocation
import { MessageSquare, Users, Phone, Settings } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const BottomNav = () => {
    const { selectedUser, selectedGroup, receivedRequests } = useChatStore();
    const location = useLocation();

    // Hide bottom nav if a chat is open on mobile
    if (selectedUser || selectedGroup) return null;

    const isActive = (path) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-base-100 border-t border-base-200 lg:hidden z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                <Link to="/" className={`flex flex-col items-center gap-1.5 p-2 transition-all ${isActive('/') ? 'text-primary' : 'text-base-content/30'}`}>
                    <MessageSquare className={`size-5.5 ${isActive('/') ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Chats</span>
                </Link>

                <button className="flex flex-col items-center gap-1.5 p-2 text-base-content/30">
                    <Phone className="size-5.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Calls</span>
                </button>

                <Link to="/friends" className={`flex flex-col items-center gap-1.5 p-2 transition-all ${isActive('/friends') ? 'text-primary' : 'text-base-content/30'} relative`}>
                    <Users className={`size-5.5 ${isActive('/friends') ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">People</span>
                    {receivedRequests.length > 0 && (
                        <span className="absolute top-1 right-2 size-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                            {receivedRequests.length}
                        </span>
                    )}
                </Link>

                <Link to="/settings" className={`flex flex-col items-center gap-1.5 p-2 transition-all ${isActive('/settings') ? 'text-primary' : 'text-base-content/30'}`}>
                    <Settings className={`size-5.5 ${isActive('/settings') ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
                </Link>
            </div>
        </div>
    );
};

export default BottomNav;
