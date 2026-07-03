import { StyleSheet, TextInput, View } from "react-native";

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  containerClassName?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search",
  containerClassName,
}: SearchBarProps) {
  return (
    <View
      className={`min-h-[44px] flex-row items-center rounded-full border border-[#E6E8F0] bg-[#FAFBFF] px-[18px] ${containerClassName ?? ""}`}
    >
      <View className="mr-[12px] h-[20px] w-[20px]">
        <View className="h-[15px] w-[15px] rounded-full border-[2px] border-[#64708D]" />
        <View className="absolute bottom-[3px] right-[2px] h-[9px] w-[3px] rotate-[-45deg] rounded-full bg-[#64708D]" />
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#68708C"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        style={styles.searchInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    color: "#030B2F",
    flex: 1,
    fontFamily: "Poppins-Medium",
    fontSize: 13,
    lineHeight: 18,
    paddingVertical: 0,
  },
});
