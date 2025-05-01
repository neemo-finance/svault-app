import ToastContent from "@/components/atom/ToastContent";
import { toast } from "react-toastify";
import { useList } from "react-use";

export const useAlerts = () => {
  const [loaderKeys, loaderKeysHandler] = useList();
  const hasLoaderKey = (id: string) => loaderKeys.includes(id);
  const addLoaderKey = (id: string) => loaderKeysHandler.push(id);
  const removeLoaderKey = (id: string) => {
    const index = loaderKeys.indexOf(id);
    loaderKeysHandler.removeAt(index);
  };

  const withKeyAlert = (msg: string, id: string, type: ToastIcon, description?: string, isLoading?: boolean) => {
    if (hasLoaderKey(id)) return;
    addLoaderKey(id);
    if (toast.isActive(id)) {
      toast.update(id, {
        render: ToastContent(type, msg, description),
        autoClose: isLoading ? false : 5000,
        onClose: () => removeLoaderKey(id),
        isLoading: isLoading,
      })
    } else {
      toast(ToastContent(type, msg, description), {
        autoClose: isLoading ? false : 5000,
        onClose: () => removeLoaderKey(id),
        toastId: id,
        isLoading: isLoading,
      });
    }
  };

  const alertError = (msg: string, id: string = new Date().toString()) =>
    withKeyAlert(msg, id, ToastIcon.Error);
  const alertSuccess = (msg: string, id: string = new Date().toString()) =>
    withKeyAlert(msg, id, ToastIcon.Success);
  const alertInfo = (msg: string, id: string = new Date().toString()) =>
    withKeyAlert(msg, id, ToastIcon.Info);
  const alertCustom = (msg: string, icon: ToastIcon = ToastIcon.Vault, description?: string, id: string = new Date().toString()) =>
    withKeyAlert(msg, id, icon, description, icon === ToastIcon.Loading);

  return { alertError, alertSuccess, alertInfo, alertCustom };
};

export enum ToastIcon {
    Vault,
    Info,
    Error,
    Success,
    Transaction,
    Warning,
    Copy,
    Loading,
}